import { defineRole } from 'twenty-sdk/define';

import { TALEP_CIKARICI_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/intake-ids';

// The extractor only turns masked text into JSON; with zero data access it
// cannot look up (and leak) a customer even if the prompt is subverted.
export default defineRole({
  universalIdentifier: TALEP_CIKARICI_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Talep Çıkarıcı (Erişimsiz)',
  description:
    'Talep Çıkarıcı ajanının rolü: hiçbir kaydı okuyamaz veya yazamaz, hiçbir aracı çalıştıramaz.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: true,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
});
