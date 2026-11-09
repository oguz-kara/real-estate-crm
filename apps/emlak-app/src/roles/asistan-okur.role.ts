import { defineRole } from 'twenty-sdk/define';

import { ASISTAN_OKUR_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/assistant-ids';

// The assistant's read-only guarantee lives HERE, in the permission layer —
// never in the prompt. Every write flag stays false; tool access stays off
// because the app's tools include writers (sweepers, matching).
export default defineRole({
  universalIdentifier: ASISTAN_OKUR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Emlak Asistanı (Salt Okunur)',
  description:
    'Emlak Asistanı ajanının rolü: tüm kayıtları okur, hiçbirini yazamaz, ' +
    'hiçbir aracı çalıştıramaz.',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: true,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
});
