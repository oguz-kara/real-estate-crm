import {
  type DatabaseEventBatchPayload,
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { runRequestMatching } from 'src/matching/run-request-matching';

type BuyerRequestRecord = { id?: string | null };

export const matchRequestOnUpdateHandler = async (
  batch: DatabaseEventBatchPayload<ObjectRecordUpdateEvent<BuyerRequestRecord>>,
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
  universalIdentifier: '297a4fd7-fecc-44f1-8266-c68fa5bf839b',
  name: 'match-request-on-update',
  description:
    'Bir alıcı talebi güncellendiğinde portföy eşleştirmesini yeniden çalıştırır; ' +
    'eşleşme durumları korunur, yalnızca puanlar tazelenir ve yeni çiftler eklenir.',
  timeoutSeconds: 120,
  databaseEventTriggerSettings: {
    // criteria fields only: edits to notes or relations must not re-trigger
    eventName: 'buyerRequest.updated',
    updatedFields: [
      'status',
      'category',
      'listingType',
      'budgetMax',
      'budgetMin',
      'districts',
      'rooms',
      'excludedFeatures',
      'features',
      'sqmNetMin',
    ],
    batchMode: true,
  },
  handler: matchRequestOnUpdateHandler,
});
