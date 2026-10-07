import {
  type IntakeAgentRunner,
  type IntakeClient,
  IntakeError,
  type IntakeInput,
  type IntakeResult,
  runIntake,
} from 'src/intake/run-intake';

export type IntakeResponse = { status: number; body: IntakeResult | { error: string } };

export const handleIntakeRequest = async (
  body: unknown,
  dependencies: { client: IntakeClient; runAgent: IntakeAgentRunner; now: number },
): Promise<IntakeResponse> => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { status: 400, body: { error: 'request body must be a json object' } };
  }
  const fields = body as Record<string, unknown>;
  const input: IntakeInput = {
    personId: typeof fields.personId === 'string' ? fields.personId : '',
    text: typeof fields.text === 'string' ? fields.text : '',
    ...(typeof fields.source === 'string' && fields.source !== ''
      ? { source: fields.source as IntakeInput['source'] }
      : {}),
  };
  try {
    const result = await runIntake(dependencies.client, dependencies.runAgent, input, dependencies.now);

    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof IntakeError) {
      return { status: error.status, body: { error: error.message } };
    }
    // The source text is customer data, so only the error message is logged.
    console.error('talep-cikar failed:', error instanceof Error ? error.message : 'unknown error');

    return { status: 500, body: { error: 'intake failed' } };
  }
};
