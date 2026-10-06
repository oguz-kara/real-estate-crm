import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { runFollowUpSweep, type SweepResult } from 'src/follow-up/run-sweep';

export const followUpSweeperHandler = (): Promise<SweepResult> =>
  runFollowUpSweep(new CoreApiClient(), Date.now());

export default defineLogicFunction({
  universalIdentifier: '9fa63498-f40a-4364-8b81-9bf302bf3dbe',
  name: 'follow-up-sweeper',
  description:
    'Takip taraması: takip aşaması dolu her kişi için son teması (not veya ' +
    'tamamlanan görev) bulur, Takipte/Vadesi Geldi/Gecikmiş durumunu yazar ve ' +
    'eşik ilk aşıldığında bir kez takip görevi oluşturur. Her gece 03:15\'te ' +
    'kendiliğinden çalışır; buradan elle de tetiklenebilir.',
  timeoutSeconds: 300,
  cronTriggerSettings: { pattern: '15 3 * * *' },
  toolTriggerSettings: { inputSchema: { type: 'object', properties: {} } },
  handler: followUpSweeperHandler,
});
