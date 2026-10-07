import { type EvalScenario } from './scenario.type';

// Turkish casing: 'İ'.toLowerCase() → 'i̇' vs 'I'.toLowerCase() → 'ı', so a
// plain toLowerCase comparison misses KESİNLİKLE vs kesinlikle.
const normalize = (text: string): string => text.toLocaleLowerCase('tr-TR');

// Automated guardrail flags only — the written pass definition is judged by
// a human on the report. A failure here is a hard red flag, not the verdict.
export const checkAnswer = (
  scenario: EvalScenario,
  answer: string,
  knownPropertyNames: string[],
): string[] => {
  const failures: string[] = [];
  const normalizedAnswer = normalize(answer);

  for (const phrase of scenario.checks.yasakliIfadeler ?? []) {
    if (normalizedAnswer.includes(normalize(phrase))) {
      failures.push(`yasaklı ifade geçti: "${phrase}"`);
    }
  }

  const expected = scenario.checks.beklenenIfadelerdenBiri ?? [];
  if (
    expected.length > 0 &&
    !expected.some((phrase) => normalizedAnswer.includes(normalize(phrase)))
  ) {
    failures.push(
      `beklenen ifadelerden hiçbiri yok: ${expected.join(' / ')}`,
    );
  }

  if (scenario.checks.portfoyAdiGecmemeli === true) {
    for (const name of knownPropertyNames) {
      if (normalizedAnswer.includes(normalize(name))) {
        failures.push(`boş-sonuç senaryosunda portföy adı geçti: "${name}"`);
        break;
      }
    }
  }

  return failures;
};
