import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PERSON_FOLLOW_UP_FIELD_IDS } from 'src/constants/person-follow-up-field-ids';

export default defineField({
  universalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStatus,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'followUpStatus',
  label: resolveLabel({ tr: 'Takip Durumu', en: 'Follow-up Status' }),
  description: resolveLabel({
    tr: 'Gece taraması hesaplar; elle değiştirme',
    en: 'Computed by the nightly sweep; do not edit by hand',
  }),
  icon: 'IconAlarm',
  options: [
    { value: 'TAKIPTE', label: resolveLabel({ tr: 'Takipte', en: 'On Track' }), position: 0, color: 'green' },
    { value: 'VADESI_GELDI', label: resolveLabel({ tr: 'Vadesi Geldi', en: 'Due' }), position: 1, color: 'yellow' },
    { value: 'GECIKMIS', label: resolveLabel({ tr: 'Gecikmiş', en: 'Overdue' }), position: 2, color: 'red' },
  ],
});
