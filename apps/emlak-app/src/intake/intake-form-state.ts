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
