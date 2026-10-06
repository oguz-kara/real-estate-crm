import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PERSON_FOLLOW_UP_FIELD_IDS } from 'src/constants/person-follow-up-field-ids';

export default defineField({
  universalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpTaskCreatedAt,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'followUpTaskCreatedAt',
  label: resolveLabel({ tr: 'Takip Görevi Tarihi', en: 'Follow-up Task Created' }),
  description: resolveLabel({
    tr: 'Tarama içi tekrar önleme damgası',
    en: 'Internal dedupe marker for lapse tasks',
  }),
  icon: 'IconChecklist',
  isUIEditable: false,
});
