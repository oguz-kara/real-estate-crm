import { describe, expect, test } from 'vitest';

import { parseEvalArgs } from '../parse-eval-args';

describe('parseEvalArgs', () => {
  test('reads the model label with or without --only', () => {
    expect(parseEvalArgs(['v4-pro'])).toEqual({ label: 'v4-pro', onlyIds: null });
    expect(parseEvalArgs(['--only', 'D1,W3', 'v4-pro'])).toEqual({ label: 'v4-pro', onlyIds: ['D1', 'W3'] });
    expect(parseEvalArgs(['v4-pro', '--only', 'D1'])).toEqual({ label: 'v4-pro', onlyIds: ['D1'] });
    expect(parseEvalArgs([])).toEqual({ label: 'deepseek-flash', onlyIds: null });
  });
});
