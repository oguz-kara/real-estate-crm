import { describe, expect, test, vi } from 'vitest';

import { AHMET_NODE, dataOf, makeClient, makeRunAgent, NOW, textResponse } from 'src/intake/__tests__/run-intake-fakes';
import { runIntake } from 'src/intake/run-intake';

vi.mock('src/intake/mask-pii', async (importOriginal) => ({
  ...(await importOriginal<typeof import('src/intake/mask-pii')>()),
  maskPii: () => ({ maskedText: 'sızdı', phoneCount: 0, emailCount: 0, nameRedacted: false, leak: true }),
}));

describe('runIntake masking guard', () => {
  test('skips the agent entirely when masking leaks and records "maskeleme eksik"', async () => {
    const { client, mutations } = makeClient(AHMET_NODE);
    const { runAgent, prompts } = makeRunAgent([textResponse({ category: 'KONUT' })]);

    const result = await runIntake(client, runAgent, { personId: 'p1', text: 'Ahmet Yılmaz Bornova 3+1 arıyor' }, NOW);

    expect(prompts).toHaveLength(0);
    expect(result.outcome).toBe('extraction-failed');
    const extraction = dataOf(mutations[0], 'createBuyerRequest').extraction as Record<string, unknown>;
    expect(extraction.unmapped).toContain('maskeleme eksik');
    expect(extraction.maskedText).toBe('');
  });
});
