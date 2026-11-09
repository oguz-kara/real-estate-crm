import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { type ImportSummary } from 'src/import/upsert-properties';
import { type ImportIssue } from 'src/import/raw-listing.type';

export type ImportReport = ImportSummary & {
  inputFile: string;
  totalInFile: number;
  unmappedIssues: ImportIssue[];
};

export const writeImportReport = (report: ImportReport): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(
    dirname(report.inputFile),
    `import-report-${timestamp}.json`,
  );
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
};
