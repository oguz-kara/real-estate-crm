import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { type MatchSweepResult, runMatchSweep } from 'src/matching/run-match-sweep';

export const requestMatchSweeperHandler = (): Promise<MatchSweepResult> =>
  runMatchSweep(new CoreApiClient(), Date.now());

export default defineLogicFunction({
  universalIdentifier: '91af62c9-8693-419d-9189-9825f1dd0dd5',
  name: 'request-match-sweeper',
  description:
    'Eşleşme taraması: her aktif alıcı talebi için portföy eşleştirmesini ' +
    'çalıştırır ve yeni eşleşme çıkan taleplere bir görev açar. Her gece ' +
    "03:45'te kendiliğinden çalışır; buradan elle de tetiklenebilir.",
  timeoutSeconds: 300,
  cronTriggerSettings: { pattern: '45 3 * * *' },
  toolTriggerSettings: { inputSchema: { type: 'object', properties: {} } },
  handler: requestMatchSweeperHandler,
});
