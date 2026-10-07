import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { checkAnswer } from '../evals/chat-assistant/check-answer';
import { EVAL_SCENARIOS } from '../evals/chat-assistant/scenarios';
import { EMLAK_ASISTANI_AGENT_UNIVERSAL_IDENTIFIER } from '../src/constants/assistant-ids';

const SERVER_URL = process.env.TWENTY_SERVER_URL ?? 'http://localhost:3000';
const TOKEN_PATH = process.env.RE_USER_TOKEN_PATH ?? '/home/user/.re-user-token';
const MODEL_LABEL = process.argv[2] ?? 'deepseek-v4-pro';
const WORKSPACE_SCHEMA = 'workspace_1wgvd1injqtife6y4rvfbu3h5';
const COUNTED_TABLES = ['person', '_property', '_buyerRequest', '_propertyMatch', 'task', 'note'];

const graphql = async (
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await fetch(`${SERVER_URL}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as Record<string, unknown>;
};

const refreshToken = async (): Promise<string> => {
  const loginResult = (await (
    await fetch(`${SERVER_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'mutation { getLoginTokenFromCredentials(email: "tim@apple.dev", password: "tim@apple.dev", origin: "http://localhost:3001") { loginToken { token } } }',
      }),
    })
  ).json()) as { data: { getLoginTokenFromCredentials: { loginToken: { token: string } } } };

  const loginToken = loginResult.data.getLoginTokenFromCredentials.loginToken.token;
  const tokensResult = (await (
    await fetch(`${SERVER_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { getAuthTokensFromLoginToken(loginToken: "${loginToken}", origin: "http://localhost:3001") { tokens { accessOrWorkspaceAgnosticToken { token } } } }`,
      }),
    })
  ).json()) as {
    data: { getAuthTokensFromLoginToken: { tokens: { accessOrWorkspaceAgnosticToken: { token: string } } } };
  };

  const token = tokensResult.data.getAuthTokensFromLoginToken.tokens.accessOrWorkspaceAgnosticToken.token;
  writeFileSync(TOKEN_PATH, token);

  return token;
};

const getToken = async (): Promise<string> => {
  try {
    const existing = readFileSync(TOKEN_PATH, 'utf8').trim();
    const probe = await graphql(existing, '{ currentUser { id } }');
    if (!('errors' in probe)) {
      return existing;
    }
  } catch {
    // fall through to refresh
  }

  return refreshToken();
};

const countRecords = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const table of COUNTED_TABLES) {
    const out = execFileSync(
      'psql',
      ['-h', 'localhost', '-p', '5432', '-U', 'postgres', '-d', 'default', '-t', '-A', '-c',
        `SELECT count(*) FROM "${WORKSPACE_SCHEMA}"."${table}" WHERE "deletedAt" IS NULL;`],
      { env: { ...process.env, PGPASSWORD: 'postgres' }, encoding: 'utf8' },
    );
    counts[table] = Number(out.trim());
  }

  return counts;
};

const fetchKnownPropertyNames = async (token: string): Promise<string[]> => {
  const response = await fetch(`${SERVER_URL}/rest/properties?limit=60`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await response.json()) as { data?: { properties?: Array<{ name?: string }> } };

  return (body.data?.properties ?? [])
    .map((property) => property.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
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
  const token = await getToken();
  const knownNames = await fetchKnownPropertyNames(token);
  const countsBefore = countRecords();

  const lines: string[] = [
    `# Sohbet asistanı değerlendirmesi — ${new Date().toISOString().slice(0, 16)} — ${MODEL_LABEL}`,
    '',
    `Senaryo sayısı: ${EVAL_SCENARIOS.length} · Bilinen portföy adı: ${knownNames.length}`,
    '',
  ];
  let automatedFailures = 0;

  for (const scenario of EVAL_SCENARIOS) {
    process.stdout.write(`[${scenario.id}] ${scenario.prompt.slice(0, 50)}... `);
    const started = Date.now();
    const response = await graphql(
      token,
      `mutation Run($input: RunAgentInput!) { runAgent(input: $input) { success result error } }`,
      {
        input: {
          agentUniversalIdentifier: EMLAK_ASISTANI_AGENT_UNIVERSAL_IDENTIFIER,
          prompt: scenario.prompt,
        },
      },
    );

    const data = (response as { data?: { runAgent?: { success: boolean; result: unknown; error: string | null } } }).data;
    const errors = (response as { errors?: Array<{ message: string }> }).errors;
    const answer = data?.runAgent?.success
      ? extractAnswerText(data.runAgent.result)
      : `HATA: ${data?.runAgent?.error ?? errors?.[0]?.message ?? 'bilinmiyor'}`;
    const failures = checkAnswer(scenario, answer, knownNames);
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

  const countsAfter = countRecords();
  const writes = COUNTED_TABLES.filter((t) => countsAfter[t] !== countsBefore[t]);
  lines.push(
    '---',
    '',
    `**Yazma denetimi:** ${writes.length === 0 ? 'YOK — hiçbir kayıt sayısı değişmedi ✓' : `VAR ❌ → ${writes.map((t) => `${t}: ${countsBefore[t]}→${countsAfter[t]}`).join(', ')}`}`,
    `**Otomatik kontrol uyarısı olan senaryo:** ${automatedFailures}/${EVAL_SCENARIOS.length}`,
    '',
  );

  const outDir = path.join(__dirname, '..', 'evals', 'chat-assistant', 'results');
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${new Date().toISOString().slice(0, 10)}-${MODEL_LABEL}.md`);
  writeFileSync(outPath, lines.join('\n'));
  console.log(`\nrapor: ${outPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
