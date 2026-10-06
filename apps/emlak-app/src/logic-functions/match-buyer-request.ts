import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  type RequestMatchingResult,
  runRequestMatching,
} from 'src/matching/run-request-matching';

export const matchBuyerRequestHandler = (input: {
  requestId: string;
}): Promise<RequestMatchingResult> =>
  runRequestMatching(new CoreApiClient(), input.requestId, Date.now());

export default defineLogicFunction({
  universalIdentifier: '2db99582-f65b-492f-ac73-b3a8ed96c481',
  name: 'match-buyer-request',
  description:
    'Tek bir alıcı talebi için portföy eşleştirmesi çalıştırır: aktif ' +
    'portföyleri talebin kriterleriyle süzer, 0-100 puanlar, yeni çiftler ' +
    'için YENI eşleşme kaydı açar, mevcutların yalnızca puanını tazeler ' +
    '(durumlarına asla dokunmaz).',
  timeoutSeconds: 120,
  toolTriggerSettings: {
    inputSchema: {
      type: 'object',
      properties: {
        requestId: {
          type: 'string',
          description: 'Eşleştirilecek alıcı talebinin kayıt id\'si (UUID).',
        },
      },
      required: ['requestId'],
    },
  },
  handler: matchBuyerRequestHandler,
});
