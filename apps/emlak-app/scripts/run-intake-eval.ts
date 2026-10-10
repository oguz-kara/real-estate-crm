import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { checkDraft, type DraftRecord } from '../evals/talep-cikarimi/check-draft';
import { parseEvalArgs } from '../evals/talep-cikarimi/parse-eval-args';
import { INTAKE_SCENARIOS } from '../evals/talep-cikarimi/scenarios';
import { countRecords, getToken, graphql, psql, refreshToken, SERVER_URL, WORKSPACE_SCHEMA } from './eval-shared';

const EVAL_ARGS = parseEvalArgs(process.argv.slice(2));
const ONLY_IDS = EVAL_ARGS.onlyIds === null ? null : new Set(EVAL_ARGS.onlyIds);
const MODEL_LABEL = EVAL_ARGS.label;
const COUNTED_TABLES = ['person', '_property', '_buyerRequest', '_propertyMatch', 'task', 'taskTarget', 'note'];
// The eval itself creates and then soft-deletes drafts, their review tasks
// and (on a first run) the fake customer; anything else changing is a bug.
const EXPECTED_WRITE_TABLES = ['_buyerRequest', 'task', 'taskTarget', 'person'];
const EVAL_PHONE = '5324567890';

const DRAFT_QUERY = `query Draft($id: UUID!) { buyerRequest(filter: { id: { eq: $id } }) {
  category listingType rooms districts features excludedFeatures
  budgetMin { amountMicros currencyCode } budgetMax { amountMicros currencyCode }
  sqmNetMin notes extraction } }`;

const ensureEvalPerson = async (token: string): Promise<{ id: string; created: boolean }> => {
  const found = (await graphql(
    token,
    `query { people(filter: { phones: { primaryPhoneNumber: { eq: "${EVAL_PHONE}" } } }, first: 1) { edges { node { id } } } }`,
    undefined,
    'graphql',
  )) as { data?: { people?: { edges: Array<{ node: { id: string } }> } } };
  const existing = found.data?.people?.edges[0]?.node.id;
  if (existing !== undefined) {
    return { id: existing, created: false };
  }
  const created = (await graphql(
    token,
    `mutation { createPerson(data: { name: { firstName: "Ahmet", lastName: "Yılmaz" }, phones: { primaryPhoneNumber: "${EVAL_PHONE}", primaryPhoneCallingCode: "+90", primaryPhoneCountryCode: "TR" } }) { id } }`,
    undefined,
    'graphql',
  )) as { data?: { createPerson?: { id: string } }; errors?: Array<{ message: string }> };
  const id = created.data?.createPerson?.id;
  if (id === undefined) {
    throw new Error(`eval kişisi oluşturulamadı: ${created.errors?.[0]?.message ?? 'bilinmiyor'}`);
  }

  return { id, created: true };
};

const softDelete = (draftIds: string[], personId: string | null): void => {
  if (draftIds.length === 0 && personId === null) {
    return;
  }
  const ids = draftIds.map((id) => `'${id}'`).join(',') || "'00000000-0000-4000-8000-000000000000'";
  const schema = `"${WORKSPACE_SCHEMA}"`;
  psql(
    `UPDATE ${schema}."task" SET "deletedAt" = now() WHERE id IN (SELECT "taskId" FROM ${schema}."taskTarget" WHERE "targetBuyerRequestId" IN (${ids}));` +
      `UPDATE ${schema}."taskTarget" SET "deletedAt" = now() WHERE "taskId" IN (SELECT "taskId" FROM ${schema}."taskTarget" WHERE "targetBuyerRequestId" IN (${ids}));` +
      `UPDATE ${schema}."_buyerRequest" SET "deletedAt" = now() WHERE id IN (${ids});` +
      (personId === null ? '' : `UPDATE ${schema}."person" SET "deletedAt" = now() WHERE id = '${personId}';`),
  );
};

const run = async (): Promise<void> => {
  const runStartIso = new Date().toISOString();
  let token = await getToken();
  const scenarios = INTAKE_SCENARIOS.filter((scenario) => ONLY_IDS === null || ONLY_IDS.has(scenario.id));
  const countsBefore = countRecords(runStartIso, COUNTED_TABLES);
  const person = await ensureEvalPerson(token);
  const agentModelId = psql(
    `SELECT "modelId" FROM core.agent WHERE name='talep-cikarici' AND "deletedAt" IS NULL LIMIT 1;`,
  );

  const lines: string[] = [
    `# Talep çıkarımı değerlendirmesi — ${runStartIso.slice(0, 16)} — ${MODEL_LABEL}`,
    '',
    `Senaryo sayısı: ${scenarios.length}${ONLY_IDS === null ? '' : ' (seçili)'} · Ajan modeli: ${agentModelId}`,
    '',
  ];
  const draftIds: string[] = [];
  let warnedScenarios = 0;
  let piiFindings = 0;

  const callRoute = async (body: Record<string, unknown>): Promise<Response> => {
    const call = () =>
      fetch(`${SERVER_URL}/s/talep/cikar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    const first = await call();
    if (first.status !== 401) {
      return first;
    }
    token = await refreshToken();

    return call();
  };

  try {
    for (const scenario of scenarios) {
      process.stdout.write(`[${scenario.id}] ${scenario.text.slice(0, 50)}... `);
      const started = Date.now();
      let failures: string[];
      let found = '';
      try {
        const response = await callRoute({ personId: person.id, text: scenario.text, source: scenario.source });
        const body = (await response.json()) as { draftId?: string; summary?: string; error?: string };
        if (response.status !== 200 || body.draftId === undefined) {
          failures = [`rota ${response.status}: ${body.error ?? 'bilinmiyor'}`];
        } else {
          draftIds.push(body.draftId);
          const draftResult = (await graphql(token, DRAFT_QUERY, { id: body.draftId }, 'graphql')) as {
            data?: { buyerRequest?: DraftRecord };
          };
          const draft = draftResult.data?.buyerRequest;
          if (draft === undefined) {
            failures = ['taslak okunamadı'];
          } else {
            failures = checkDraft(scenario, draft);
            const { extraction, ...criteria } = draft;
            found = `${body.summary ?? ''}\n\n${JSON.stringify(criteria, null, 1)}\n\nmaskedText: ${extraction?.maskedText ?? ''}`;
          }
        }
      } catch (error) {
        failures = [`istisna: ${error instanceof Error ? error.message : String(error)}`];
      }
      warnedScenarios += failures.length > 0 ? 1 : 0;
      piiFindings += failures.includes('maskedText kişisel veri içeriyor') ? 1 : 0;
      console.log(`${Date.now() - started}ms${failures.length > 0 ? ' ⚠' : ''}`);

      lines.push(
        `## ${scenario.id} (${scenario.style})`,
        '',
        `**Metin:** ${scenario.text}`,
        `**Beklenen:** ${JSON.stringify(scenario.expected)}${scenario.featuresInclude === undefined ? '' : ` · özellikler ⊇ ${scenario.featuresInclude.join(', ')}`}${scenario.mustBeEmpty === undefined ? '' : ` · boş: ${scenario.mustBeEmpty.join(', ')}`}`,
        `**Geçme tanımı:** ${scenario.gecmeTanimi}`,
        `**Otomatik kontroller:** ${failures.length === 0 ? 'temiz' : failures.map((failure) => `❌ ${failure}`).join(' · ')}`,
        '',
        '**Bulunan:**',
        '',
        '```',
        found,
        '```',
        '',
        '**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_',
        '',
      );
    }
  } finally {
    softDelete(draftIds, person.created ? person.id : null);
  }

  const countsAfter = countRecords(runStartIso, COUNTED_TABLES);
  const unexpectedWrites = Object.keys(countsBefore).filter(
    (key) =>
      countsAfter[key] !== countsBefore[key] &&
      !EXPECTED_WRITE_TABLES.some((table) => key === table || key === `${table}.updated`),
  );
  const leftovers = COUNTED_TABLES.filter((table) => countsAfter[table] !== countsBefore[table]);
  lines.push(
    '---',
    '',
    `**Yazma denetimi:** ${unexpectedWrites.length === 0 ? 'beklenmeyen yazma YOK ✓' : `VAR ❌ → ${unexpectedWrites.map((key) => `${key}: ${countsBefore[key]}→${countsAfter[key]}`).join(', ')}`}`,
    `**Temizlik:** ${leftovers.length === 0 ? 'taslaklar, görevler ve eval kişisi silindi; kayıt sayıları başlangıçla aynı ✓' : `kalan fark ❌ → ${leftovers.join(', ')}`}`,
    `**Maskeleme ihlali:** ${piiFindings}`,
    `**Otomatik kontrol uyarısı olan senaryo:** ${warnedScenarios}/${scenarios.length}`,
    '',
  );

  const outDir = path.join(__dirname, '..', 'evals', 'talep-cikarimi', 'results');
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${runStartIso.slice(0, 16).replace(':', '')}-${MODEL_LABEL}.md`);
  writeFileSync(outPath, lines.join('\n'));
  console.log(`\nrapor: ${outPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
