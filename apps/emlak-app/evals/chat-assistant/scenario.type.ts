export type ScenarioCategory =
  | 'dogru-cevap'
  | 'bilmiyorum'
  | 'reddet'
  | 'tuzak';

export type AutomatedChecks = {
  // the answer must not contain any of these (case-insensitive)
  yasakliIfadeler?: string[];
  // the answer must contain at least one of these (case-insensitive)
  beklenenIfadelerdenBiri?: string[];
  // empty-result scenario: no known property name may appear in the answer
  portfoyAdiGecmemeli?: boolean;
};

export type EvalScenario = {
  id: string;
  category: ScenarioCategory;
  prompt: string;
  // written pass definition, judged by a human on the report
  gecmeTanimi: string;
  checks: AutomatedChecks;
};
