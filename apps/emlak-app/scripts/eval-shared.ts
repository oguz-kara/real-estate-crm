import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export const SERVER_URL = process.env.TWENTY_SERVER_URL ?? 'http://localhost:3000';
export const TOKEN_PATH = process.env.RE_USER_TOKEN_PATH ?? '/home/user/.re-user-token';
export const WORKSPACE_SCHEMA = 'workspace_1wgvd1injqtife6y4rvfbu3h5';

export const graphql = async (
  token: string,
  query: string,
  variables?: Record<string, unknown>,
  endpoint: 'metadata' | 'graphql' = 'metadata',
): Promise<Record<string, unknown>> => {
  const response = await fetch(`${SERVER_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as Record<string, unknown>;
};

export const refreshToken = async (): Promise<string> => {
  const loginResult = (await (
    await fetch(`${SERVER_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'mutation { getLoginTokenFromCredentials(email: "tim@apple.dev", password: "tim@apple.dev", origin: "http://localhost:3001") { loginToken { token } } }',
      }),
    })
  ).json()) as {
    data?: { getLoginTokenFromCredentials?: { loginToken?: { token: string } } };
    errors?: Array<{ message: string }>;
  };

  const loginToken = loginResult.data?.getLoginTokenFromCredentials?.loginToken?.token;
  if (loginToken === undefined) {
    throw new Error(
      `giriş başarısız (DB reset sonrası seed kullanıcı silinmiş olabilir): ${loginResult.errors?.[0]?.message ?? 'bilinmeyen hata'}`,
    );
  }
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

  const token =
    tokensResult.data.getAuthTokensFromLoginToken.tokens.accessOrWorkspaceAgnosticToken.token;
  writeFileSync(TOKEN_PATH, token);

  return token;
};

export const getToken = async (): Promise<string> => {
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

export const psql = (sql: string): string =>
  execFileSync(
    'psql',
    ['-h', 'localhost', '-p', '5432', '-U', 'postgres', '-d', 'default', '-t', '-A', '-c', sql],
    { env: { ...process.env, PGPASSWORD: 'postgres' }, encoding: 'utf8' },
  ).trim();

// count catches creates/deletes; the updatedAt probe catches UPDATEs —
// RD1-style "change the price" would alter no row count at all
export const countRecords = (
  runStartIso: string,
  tables: readonly string[],
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const table of tables) {
    counts[table] = Number(
      psql(`SELECT count(*) FROM "${WORKSPACE_SCHEMA}"."${table}" WHERE "deletedAt" IS NULL;`),
    );
    counts[`${table}.updated`] = Number(
      psql(
        `SELECT count(*) FROM "${WORKSPACE_SCHEMA}"."${table}" WHERE "updatedAt" >= '${runStartIso}';`,
      ),
    );
  }

  return counts;
};
