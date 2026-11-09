import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { metadataLabel, trLabel } from 'src/constants/app-locale';
import { PERSON_FOLLOW_UP_FIELD_IDS } from 'src/constants/person-follow-up-field-ids';

export default defineField({
  universalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStatus,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'followUpStatus',
  label: metadataLabel({ tr: 'Takip Durumu', en: 'Follow-up Status' }),
  description: metadataLabel({
    tr: 'Gece taraması hesaplar; elle değiştirme',
    en: 'Computed by the nightly sweep; do not edit by hand',
  }),
  icon: 'IconAlarm',
  options: [
    { value: 'TAKIPTE', label: trLabel({ tr: 'Takipte', en: 'On Track' }), position: 0, color: 'green' },
    { value: 'VADESI_GELDI', label: trLabel({ tr: 'Vadesi Geldi', en: 'Due' }), position: 1, color: 'yellow' },
    { value: 'GECIKMIS', label: trLabel({ tr: 'Gecikmiş', en: 'Overdue' }), position: 2, color: 'red' },
  ],
});
