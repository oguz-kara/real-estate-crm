import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { metadataLabel, trLabel } from 'src/constants/app-locale';
import { PERSON_FOLLOW_UP_FIELD_IDS } from 'src/constants/person-follow-up-field-ids';

export default defineField({
  universalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStage,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'followUpStage',
  label: metadataLabel({ tr: 'Takip Aşaması', en: 'Follow-up Stage' }),
  description: metadataLabel({
    tr: 'Doluysa kişi takip taramasına girer; boşsa takip edilmez',
    en: 'When set, the person is enrolled in the follow-up sweep',
  }),
  icon: 'IconFlame',
  options: [
    { value: 'SICAK', label: trLabel({ tr: 'Sıcak', en: 'Hot' }), position: 0, color: 'red' },
    { value: 'ILIK', label: trLabel({ tr: 'Ilık', en: 'Warm' }), position: 1, color: 'orange' },
    { value: 'UZUN_VADELI', label: trLabel({ tr: 'Uzun Vadeli', en: 'Long Term' }), position: 2, color: 'blue' },
  ],
});
