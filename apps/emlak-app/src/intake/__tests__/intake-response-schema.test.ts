import { describe, expect, test } from 'vitest';

import {
  buildIntakePrompt,
  INTAKE_AGENT_PROMPT,
  INTAKE_MODEL_ID,
  INTAKE_RESPONSE_SCHEMA,
} from 'src/intake/intake-response-schema';
import { RAW_EXTRACTION_KEYS } from 'src/intake/raw-extraction';

describe('intake response schema', () => {
  test('response schema covers every raw extraction key as a required string', () => {
    expect(Object.keys(INTAKE_RESPONSE_SCHEMA.properties).sort()).toEqual(
      [...RAW_EXTRACTION_KEYS].sort(),
    );
    expect(
      Object.values(INTAKE_RESPONSE_SCHEMA.properties).every((property) => property.type === 'string'),
    ).toBe(true);
    expect(INTAKE_RESPONSE_SCHEMA.required).toHaveLength(RAW_EXTRACTION_KEYS.length);
    expect(INTAKE_RESPONSE_SCHEMA.additionalProperties).toBe(false);
  });

  test('uses the cheap flash model', () => {
    expect(INTAKE_MODEL_ID).toBe('deepseek/deepseek-flash');
  });

  test('agent prompt asks for a json object and lists every key with its description', () => {
    expect(INTAKE_AGENT_PROMPT).toContain('json');
    for (const key of RAW_EXTRACTION_KEYS) {
      expect(INTAKE_AGENT_PROMPT).toContain(
        `- ${key}: ${INTAKE_RESPONSE_SCHEMA.properties[key].description}`,
      );
    }
  });

  test('prompt fences the masked text', () => {
    expect(buildIntakePrompt('[MÜŞTERİ] Bornova 3+1')).toBe('Metin:\n"""\n[MÜŞTERİ] Bornova 3+1\n"""');
  });
});
