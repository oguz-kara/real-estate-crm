import { describe, expect, test } from 'vitest';

import {
  canSubmitIntake,
  intakeSuccessMessage,
  selectionHint,
  submitIntake,
} from 'src/intake/intake-form-state';

describe('intake form state', () => {
  test('submit needs exactly one person, 10+ trimmed characters and no request in flight', () => {
    expect(canSubmitIntake({ text: 'Bornova 3+1 arıyor', selectedCount: 1, submitting: false })).toBe(true);
    expect(canSubmitIntake({ text: '   kısa    ', selectedCount: 1, submitting: false })).toBe(false);
    expect(canSubmitIntake({ text: 'Bornova 3+1 arıyor', selectedCount: 2, submitting: false })).toBe(false);
    expect(canSubmitIntake({ text: 'Bornova 3+1 arıyor', selectedCount: 0, submitting: false })).toBe(false);
    expect(canSubmitIntake({ text: 'Bornova 3+1 arıyor', selectedCount: 1, submitting: true })).toBe(false);
  });

  test('selection hint explains a wrong selection', () => {
    expect(selectionHint(1)).toBeNull();
    expect(selectionHint(0)).toBe('Tek bir kişi seçin.');
    expect(selectionHint(3)).toBe('Tek bir kişi seçin.');
  });

  test('success message counts missing fields and points to the approval view', () => {
    expect(
      intakeSuccessMessage({ draftId: 'd', missingFields: ['budgetMin', 'sqmNetMin'], summary: 's', outcome: 'ok' }),
    ).toBe('Taslak talep oluşturuldu (2 eksik alan). Onay: Talepler → Onay Bekleyen Talepler');
    expect(
      intakeSuccessMessage({ draftId: 'd', missingFields: [], summary: 's', outcome: 'extraction-failed' }),
    ).toBe('Kriterler çıkarılamadı; taslak yalnızca kaynak metinle açıldı. Onay: Talepler → Onay Bekleyen Talepler');
  });
});

describe('submitIntake', () => {
  const RESULT = { draftId: 'd1', missingFields: [], summary: 's', outcome: 'ok' as const };

  test('a side panel error after a created draft is still a success', async () => {
    const messages: string[] = [];
    const outcome = await submitIntake({
      post: async () => RESULT,
      notify: async (message) => {
        messages.push(message);
      },
      openDraft: async () => {
        throw new Error('side panel');
      },
    });
    expect(outcome).toBe('created');
    expect(messages).toEqual([intakeSuccessMessage(RESULT)]);
  });

  test('a failed request reports an error and allows a retry', async () => {
    const messages: string[] = [];
    const outcome = await submitIntake({
      post: async () => {
        throw new Error('500');
      },
      notify: async (message) => {
        messages.push(message);
      },
      openDraft: async () => undefined,
    });
    expect(outcome).toBe('failed');
    expect(messages).toEqual(['Taslak oluşturulamadı, tekrar deneyin.']);
  });
});
