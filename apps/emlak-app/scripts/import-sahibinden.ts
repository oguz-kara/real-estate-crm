import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeListing } from 'src/import/normalize-listing';
import { writeImportReport } from 'src/import/import-report';
import { upsertProperties } from 'src/import/upsert-properties';
import { type ImportIssue, type RawListing } from 'src/import/raw-listing.type';

const REQUIRED_FIELDS = ['externalId', 'name', 'category'] as const;
const API_KEY_FILE = '/home/user/.re-api-key';

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const inputFile = args.find((arg) => !arg.startsWith('--'));

  if (inputFile === undefined) {
    console.error('Usage: yarn import:sahibinden <file.json> [--dry-run]');
    process.exit(1);
  }

  const apiKey =
    process.env.TWENTY_API_KEY ??
    (existsSync(API_KEY_FILE)
      ? readFileSync(API_KEY_FILE, 'utf8').trim()
      : undefined);

  if (apiKey === undefined) {
    console.error('No API key: set TWENTY_API_KEY or create ' + API_KEY_FILE);
    process.exit(1);
  }

  const baseUrl = process.env.TWENTY_BASE_URL ?? 'http://localhost:3000';
  const resolvedInput = resolve(inputFile);
  const parsed = JSON.parse(readFileSync(resolvedInput, 'utf8')) as Record<
    string,
    unknown
  >;
  const rawListings = (parsed['İlan Listesi'] ?? []) as RawListing[];

  const issues: ImportIssue[] = [];
  const seenExternalIds = new Set<string>();
  const records: Array<Record<string, unknown>> = [];
  let skippedInvalid = 0;

  for (const rawListing of rawListings) {
    const externalId = rawListing['İlan no'];

    // first occurrence wins; later duplicates inside the same file are
    // reported, never upserted twice
    if (externalId && seenExternalIds.has(externalId)) {
      issues.push({
        externalId,
        field: 'İlan no',
        raw: externalId,
        reason: 'DUPLICATE',
      });
      continue;
    }
    if (externalId) {
      seenExternalIds.add(externalId);
    }

    const normalized = normalizeListing(rawListing);
    issues.push(...normalized.issues);

    const missingField = REQUIRED_FIELDS.find(
      (field) => normalized.record[field] === undefined,
    );

    if (missingField !== undefined) {
      skippedInvalid += 1;
      issues.push({
        externalId: externalId ?? null,
        field: missingField,
        raw: '(missing)',
        reason: 'INVALID',
      });
      continue;
    }

    records.push(normalized.record);
  }

  const summary = await upsertProperties(records, { dryRun, baseUrl, apiKey });
  summary.skipped += skippedInvalid;
  summary.issues = [...issues, ...summary.issues];

  const reportPath = writeImportReport({
    ...summary,
    inputFile: resolvedInput,
    totalInFile: rawListings.length,
    unmappedIssues: summary.issues.filter(
      (issue) =>
        issue.reason === 'UNMAPPED_KEY' || issue.reason === 'UNMAPPED_VALUE',
    ),
  });

  console.log(
    `${dryRun ? '[dry-run] ' : ''}total ${rawListings.length} | ` +
      `created ${summary.created} | updated ${summary.updated} | ` +
      `would-create ${summary.wouldCreate} | would-update ${summary.wouldUpdate} | ` +
      `skipped ${summary.skipped} | issues ${summary.issues.length}`,
  );
  console.log(`report: ${reportPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
