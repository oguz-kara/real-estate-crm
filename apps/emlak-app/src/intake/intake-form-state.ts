import { INTAKE_MIN_TEXT_LENGTH } from 'src/constants/intake-limits';
import type { IntakeResult } from 'src/intake/run-intake';

const APPROVAL_HINT = 'Onay: Talepler → Onay Bekleyen Talepler';

export const canSubmitIntake = (state: {
  text: string;
  selectedCount: number;
  submitting: boolean;
}): boolean =>
  state.selectedCount === 1 &&
  !state.submitting &&
  state.text.trim().length >= INTAKE_MIN_TEXT_LENGTH;

export const selectionHint = (selectedCount: number): string | null =>
  selectedCount === 1 ? null : 'Tek bir kişi seçin.';

export const intakeSuccessMessage = (result: IntakeResult): string =>
  result.outcome === 'ok'
    ? `Taslak talep oluşturuldu (${result.missingFields.length} eksik alan). ${APPROVAL_HINT}`
    : `Kriterler çıkarılamadı; taslak yalnızca kaynak metinle açıldı. ${APPROVAL_HINT}`;

type SnackbarVariant = 'success' | 'warning' | 'error';

export type IntakeSubmissionDependencies = {
  post: () => Promise<IntakeResult>;
  notify: (message: string, variant: SnackbarVariant) => Promise<void>;
  openDraft: (draftId: string) => Promise<void>;
};

// Only the request itself can fail the submission: once a draft id exists,
// telling the user to retry would create a duplicate.
export const submitIntake = async (
  dependencies: IntakeSubmissionDependencies,
): Promise<'created' | 'failed'> => {
  let result: IntakeResult;
  try {
    result = await dependencies.post();
  } catch {
    await dependencies.notify('Taslak oluşturulamadı, tekrar deneyin.', 'error');

    return 'failed';
  }
  try {
    await dependencies.notify(
      intakeSuccessMessage(result),
      result.outcome === 'ok' ? 'success' : 'warning',
    );
    await dependencies.openDraft(result.draftId);
  } catch {
    // the draft exists; a UI hiccup here is not a failed intake
  }

  return 'created';
};
