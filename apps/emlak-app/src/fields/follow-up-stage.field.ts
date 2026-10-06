import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PERSON_FOLLOW_UP_FIELD_IDS } from 'src/constants/person-follow-up-field-ids';

export default defineField({
  universalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStage,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'followUpStage',
  label: resolveLabel({ tr: 'Takip Aşaması', en: 'Follow-up Stage' }),
  description: resolveLabel({
    tr: 'Doluysa kişi takip taramasına girer; boşsa takip edilmez',
    en: 'When set, the person is enrolled in the follow-up sweep',
  }),
  icon: 'IconFlame',
  options: [
    { value: 'SICAK', label: resolveLabel({ tr: 'Sıcak', en: 'Hot' }), position: 0, color: 'red' },
    { value: 'ILIK', label: resolveLabel({ tr: 'Ilık', en: 'Warm' }), position: 1, color: 'orange' },
    { value: 'UZUN_VADELI', label: resolveLabel({ tr: 'Uzun Vadeli', en: 'Long Term' }), position: 2, color: 'blue' },
  ],
});
