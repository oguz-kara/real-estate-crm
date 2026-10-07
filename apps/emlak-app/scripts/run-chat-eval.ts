import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { checkAnswer } from '../evals/chat-assistant/check-answer';
import { EVAL_SCENARIOS } from '../evals/chat-assistant/scenarios';
import { EMLAK_ASISTANI_AGENT_UNIVERSAL_IDENTIFIER } from '../src/constants/assistant-ids';
import { countRecords, getToken, graphql, psql, refreshToken, WORKSPACE_SCHEMA } from './eval-shared';

const MODEL_LABEL = process.argv[2] ?? 'deepseek-v4-pro';
const COUNTED_TABLES = ['person', '_property', '_buyerRequest', '_propertyMatch', 'task', 'note'];

const fetchKnownPropertyNames = (): string[] => {
  const names = psql(
    `SELECT name FROM "${WORKSPACE_SCHEMA}"."_property" WHERE "deletedAt" IS NULL AND name <> '';`,
  )
    .split('\n')
    .filter((name) => name.length > 0);
  if (names.length === 0) {
    throw new Error('bilinen portföy adı listesi boş — halüsinasyon kontrolü çalışamaz');
  }

  return names;
};

const extractAnswerText = (result: unknown): string => {
  if (result === null || result === undefined) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'object') {
    const record = result as Record<string, unknown>;
    for (const key of ['response', 'text', 'output', 'content', 'message', 'answer']) {
      if (typeof record[key] === 'string') return record[key] as string;
    }
    return JSON.stringify(result);
  }

  return String(result);
};

const run = async (): Promise<void> => {
  const runStart = new Date();
  const runStartIso = runStart.toISOString();
  const token = await getToken();
  const knownNames = fetchKnownPropertyNames();
  const countsBefore = countRecords(runStartIso, COUNTED_TABLES);
  const agentModelId = psql(
    `SELECT "modelId" FROM core.agent WHERE name='emlak-asistani' AND "deletedAt" IS NULL LIMIT 1;`,
  );

  const lines: string[] = [
    `# Sohbet asistanı değerlendirmesi — ${runStartIso.slice(0, 16)} — ${MODEL_LABEL}`,
    '',
    `Senaryo sayısı: ${EVAL_SCENARIOS.length} · Bilinen portföy adı: ${knownNames.length} · Ajan modeli: ${agentModelId}`,
    '',
  ];
  let automatedFailures = 0;

  let activeToken = token;
  const runScenario = async (prompt: string): Promise<Record<string, unknown>> => {
    const call = () =>
      graphql(
        activeToken,
        `mutation Run($input: RunAgentInput!) { runAgent(input: $input) { success result error } }`,
        {
          input: {
            agentUniversalIdentifier: EMLAK_ASISTANI_AGENT_UNIVERSAL_IDENTIFIER,
            prompt,
          },
        },
      );
    const first = await call();
    // long runs outlive the access token; refresh once and retry
    const firstErrors = (first as { errors?: Array<{ message: string }> }).errors;
    if (firstErrors?.some((e) => e.message.includes('Token has expired'))) {
      activeToken = await refreshToken();

      return call();
    }

    return first;
  };

  for (const scenario of EVAL_SCENARIOS) {
    process.stdout.write(`[${scenario.id}] ${scenario.prompt.slice(0, 50)}... `);
    const started = Date.now();
    let answer: string;
    let failures: string[];
    try {
      const response = await runScenario(scenario.prompt);
      const data = (response as { data?: { runAgent?: { success: boolean; result: unknown; error: string | null } } }).data;
      const errors = (response as { errors?: Array<{ message: string }> }).errors;
      if (data?.runAgent?.success === true) {
        answer = extractAnswerText(data.runAgent.result);
        failures = checkAnswer(scenario, answer, knownNames);
      } else {
        // a failed call must never read as a clean scenario
        answer = `HATA: ${data?.runAgent?.error ?? errors?.[0]?.message ?? 'bilinmiyor'}`;
        failures = ['ajan çağrısı başarısız — senaryo koşulamadı'];
      }
    } catch (error) {
      answer = `HATA (istisna): ${error instanceof Error ? error.message : String(error)}`;
      failures = ['ajan çağrısı başarısız — senaryo koşulamadı'];
    }
    automatedFailures += failures.length > 0 ? 1 : 0;
    console.log(`${Date.now() - started}ms${failures.length > 0 ? ' ⚠' : ''}`);

    lines.push(
      `## ${scenario.id} (${scenario.category})`,
      '',
      `**Soru:** ${scenario.prompt}`,
      `**Geçme tanımı:** ${scenario.gecmeTanimi}`,
      `**Otomatik kontroller:** ${failures.length === 0 ? 'temiz' : failures.map((f) => `❌ ${f}`).join(' · ')}`,
      '',
      '**Cevap:**',
      '',
      '```',
      answer,
      '```',
      '',
      '**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_',
      '',
    );
  }

  const countsAfter = countRecords(runStartIso, COUNTED_TABLES);
  const writes = Object.keys(countsBefore).filter(
    (key) => countsAfter[key] !== countsBefore[key],
  );
  lines.push(
    '---',
    '',
    `**Yazma denetimi:** ${writes.length === 0 ? 'YOK — kayıt sayıları ve updatedAt değişmedi ✓' : `VAR ❌ → ${writes.map((t) => `${t}: ${countsBefore[t]}→${countsAfter[t]}`).join(', ')}`}`,
    `**Otomatik kontrol uyarısı olan senaryo:** ${automatedFailures}/${EVAL_SCENARIOS.length}`,
    '',
  );

  const outDir = path.join(__dirname, '..', 'evals', 'chat-assistant', 'results');
  mkdirSync(outDir, { recursive: true });
  // minute-stamped so a rerun never overwrites a human-annotated report
  const outPath = path.join(
    outDir,
    `${runStartIso.slice(0, 16).replace(':', '')}-${MODEL_LABEL}.md`,
  );
  writeFileSync(outPath, lines.join('\n'));
  console.log(`\nrapor: ${outPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
