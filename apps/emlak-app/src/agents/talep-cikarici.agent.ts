import { defineAgent } from 'twenty-sdk/define';

import {
  TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER,
  TALEP_CIKARICI_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/intake-ids';
import { INTAKE_AGENT_PROMPT, INTAKE_MODEL_ID } from 'src/intake/intake-response-schema';

export default defineAgent({
  universalIdentifier: TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER,
  name: 'talep-cikarici',
  label: 'Talep Çıkarıcı',
  icon: 'IconFileSearch',
  description:
    'Maskelenmiş serbest metinden yapılandırılmış alıcı talebi kriterleri çıkarır; hiçbir kayda erişemez.',
  prompt: INTAKE_AGENT_PROMPT,
  modelId: INTAKE_MODEL_ID,
  responseFormat: { type: 'text' },
  roleUniversalIdentifier: TALEP_CIKARICI_ROLE_UNIVERSAL_IDENTIFIER,
});
