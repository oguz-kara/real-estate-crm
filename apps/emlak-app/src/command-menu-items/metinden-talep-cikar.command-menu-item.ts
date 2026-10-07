import { defineCommandMenuItem, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

import {
  METINDEN_TALEP_CIKAR_COMMAND_UNIVERSAL_IDENTIFIER,
  TALEP_CIKAR_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/intake-ids';

export default defineCommandMenuItem({
  universalIdentifier: METINDEN_TALEP_CIKAR_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Metinden talep çıkar',
  shortLabel: 'Talep çıkar',
  icon: 'IconFileSearch',
  isPinned: false,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier: TALEP_CIKAR_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
