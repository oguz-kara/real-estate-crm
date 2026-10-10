import { type ImportIssue } from 'src/import/raw-listing.type';

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  wouldCreate: number;
  wouldUpdate: number;
  dryRun: boolean;
  issues: ImportIssue[];
};

export type UpsertOptions = {
  dryRun: boolean;
  baseUrl: string;
  apiKey: string;
};

// the server rate-limits API keys (100 requests / 60s); an import is 2
// requests per record, so larger files must wait the window out
const RATE_LIMIT_BACKOFF_SECONDS = [5, 15, 30, 65];

const sleepSeconds = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const requestJson = async (
  url: string,
  options: UpsertOptions,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> => {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (response.status === 429 && attempt < RATE_LIMIT_BACKOFF_SECONDS.length) {
      const waitSeconds = RATE_LIMIT_BACKOFF_SECONDS[attempt];
      console.log(`rate limited, waiting ${waitSeconds}s...`);
      await sleepSeconds(waitSeconds);
      continue;
    }

    return { ok: response.ok, status: response.status, body };
  }
};

const findExistingId = async (
  externalId: string,
  options: UpsertOptions,
): Promise<string | null> => {
  const { body } = await requestJson(
    `${options.baseUrl}/rest/properties?filter=externalId[eq]:${encodeURIComponent(externalId)}&limit=1`,
    options,
  );
  const data = body.data as { properties?: Array<{ id: string }> } | undefined;

  return data?.properties?.[0]?.id ?? null;
};

export const upsertProperties = async (
  records: Array<Record<string, unknown>>,
  options: UpsertOptions,
): Promise<ImportSummary> => {
  const summary: ImportSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    wouldCreate: 0,
    wouldUpdate: 0,
    dryRun: options.dryRun,
    issues: [],
  };

  for (const record of records) {
    const externalId = record.externalId as string;
    const existingId = await findExistingId(externalId, options);

    if (options.dryRun) {
      if (existingId === null) {
        summary.wouldCreate += 1;
      } else {
        summary.wouldUpdate += 1;
      }
      continue;
    }

    const result =
      existingId === null
        ? await requestJson(`${options.baseUrl}/rest/properties`, options, {
            method: 'POST',
            body: JSON.stringify(record),
          })
        : await requestJson(
            `${options.baseUrl}/rest/properties/${existingId}`,
            options,
            // the record is a full snapshot of the listing, so a PATCH with
            // every field is an idempotent overwrite
            { method: 'PATCH', body: JSON.stringify(record) },
          );

    if (!result.ok) {
      summary.skipped += 1;
      summary.issues.push({
        externalId,
        field: '(upsert)',
        raw: JSON.stringify(result.body).slice(0, 300),
        reason: 'INVALID',
      });
      continue;
    }

    if (existingId === null) {
      summary.created += 1;
    } else {
      summary.updated += 1;
    }
  }

  return summary;
};
