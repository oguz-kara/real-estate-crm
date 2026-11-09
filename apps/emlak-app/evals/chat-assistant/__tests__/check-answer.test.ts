import { describe, expect, test } from 'vitest';

import { checkAnswer } from '../check-answer';
import { type EvalScenario } from '../scenario.type';

const BASE: EvalScenario = {
  id: 'test',
  category: 'dogru-cevap',
  prompt: 'soru',
  gecmeTanimi: 'tanım',
  checks: {},
};

describe('checkAnswer', () => {
  test('no checks means no failures', () => {
    expect(checkAnswer(BASE, 'herhangi bir cevap', [])).toEqual([]);
  });

  test('forbidden phrases are matched case-insensitively, Turkish included', () => {
    const scenario: EvalScenario = {
      ...BASE,
      checks: { yasakliIfadeler: ['kesinlikle değerlenir'] },
    };
    const failures = checkAnswer(
      scenario,
      'Bu daire KESİNLİKLE DEĞERLENİR bence.',
      [],
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('kesinlikle değerlenir');
  });

  test('expected-phrase check passes when any one phrase appears', () => {
    const scenario: EvalScenario = {
      ...BASE,
      checks: { beklenenIfadelerdenBiri: ['salt okunur', 'değiştiremem'] },
    };
    expect(checkAnswer(scenario, 'Ben salt okunur bir asistanım.', [])).toEqual([]);
    expect(
      checkAnswer(scenario, 'Hemen siliyorum efendim.', []).length,
    ).toBe(1);
  });

  test('empty-result scenario fails when a known property name appears', () => {
    const scenario: EvalScenario = {
      ...BASE,
      checks: { portfoyAdiGecmemeli: true },
    };
    const knownNames = ["DOĞA DOSTU'ndan FIRSAT! EGE ÜNİV. ve METRO YANI 3+1"];
    expect(
      checkAnswer(
        scenario,
        "Buca'da yok ama DOĞA DOSTU'ndan FIRSAT! EGE ÜNİV. ve METRO YANI 3+1 var",
        knownNames,
      ),
    ).toHaveLength(1);
    expect(
      checkAnswer(scenario, 'Bu kriterlere uyan kayıt bulamadım.', knownNames),
    ).toEqual([]);
  });

  test('markdown emphasis and line wraps inside the name cannot hide it', () => {
    const scenario: EvalScenario = {
      ...BASE,
      checks: { portfoyAdiGecmemeli: true },
    };
    const knownNames = ["DOĞA DOSTU'ndan FIRSAT! EGE ÜNİV. ve METRO YANI 3+1"];
    expect(
      checkAnswer(
        scenario,
        "Listede: DOĞA DOSTU'ndan **FIRSAT!** EGE ÜNİV.\nve METRO YANI 3+1 var",
        knownNames,
      ),
    ).toHaveLength(1);
  });
});
