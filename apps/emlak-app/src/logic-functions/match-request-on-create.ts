import {
  type DatabaseEventBatchPayload,
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { runRequestMatching } from 'src/matching/run-request-matching';

type BuyerRequestRecord = { id?: string | null };

export const matchRequestOnCreateHandler = async (
  batch: DatabaseEventBatchPayload<ObjectRecordCreateEvent<BuyerRequestRecord>>,
): Promise<void> => {
  const requestIds = new Set<string>();
  for (const event of batch.events) {
    const requestId = event.properties.after?.id ?? event.recordId;
    if (requestId) {
      requestIds.add(requestId);
    }
  }

  const client = new CoreApiClient();
  for (const requestId of requestIds) {
    await runRequestMatching(client, requestId, Date.now());
  }
};

export default defineLogicFunction({
  universalIdentifier: '8570c666-76ff-4eaa-b41b-1391f589db10',
  name: 'match-request-on-create',
  description:
    'Yeni bir alıcı talebi kaydedildiği anda portföy eşleştirmesini çalıştırır.',
  timeoutSeconds: 120,
  databaseEventTriggerSettings: {
    eventName: 'buyerRequest.created',
    batchMode: true,
  },
  handler: matchRequestOnCreateHandler,
});
