import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PERSON_FOLLOW_UP_FIELD_IDS } from 'src/constants/person-follow-up-field-ids';

export default defineField({
  universalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.lastTouchedAt,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'lastTouchedAt',
  label: resolveLabel({ tr: 'Son Temas', en: 'Last Touched' }),
  description: resolveLabel({
    tr: 'Kişiye düşen son not veya tamamlanan son görev; tarama yazar',
    en: 'Latest note or completed task on the person; written by the sweep',
  }),
  icon: 'IconClockCheck',
});
