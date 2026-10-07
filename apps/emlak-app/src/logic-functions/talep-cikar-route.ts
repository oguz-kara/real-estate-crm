import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import {
  TALEP_CIKAR_ROUTE_UNIVERSAL_IDENTIFIER,
  TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/intake-ids';
import { handleIntakeRequest } from 'src/intake/handle-intake-request';
import { type IntakeAgentRunner } from 'src/intake/run-intake';

const runExtractionAgent: IntakeAgentRunner = async (prompt) => {
  const result = await new MetadataApiClient().mutation({
    runAgent: {
      __args: { input: { agentUniversalIdentifier: TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER, prompt } },
      success: true,
      result: true,
      error: true,
    },
  });

  return result.runAgent;
};

const handler = async (event: RoutePayload): Promise<Response> => {
  const response = await handleIntakeRequest(event.body, {
    client: new CoreApiClient(),
    runAgent: runExtractionAgent,
    now: Date.now(),
  });

  return new Response(JSON.stringify(response.body), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default defineLogicFunction({
  universalIdentifier: TALEP_CIKAR_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'talep-cikar-route',
  description: 'Serbest metinden taslak alıcı talebi çıkarır (kişisel veri maskelenir).',
  timeoutSeconds: 60,
  handler,
  httpRouteTriggerSettings: {
    path: '/talep/cikar',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
