import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewType,
} from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import {
  PERSON_FOLLOW_UP_FIELD_IDS,
  TAKIP_BEKLEYENLER_VIEW_ID,
} from 'src/constants/person-follow-up-field-ids';

export default defineView({
  universalIdentifier: TAKIP_BEKLEYENLER_VIEW_ID,
  name: resolveLabel({ tr: 'Takip Bekleyenler', en: 'Awaiting Follow-up' }),
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconAlarm',
  position: 10,
  filters: [
    {
      universalIdentifier: '99ae8b90-958b-483d-8a1c-6fef4af768cb',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStatus,
      operand: ViewFilterOperand.IS,
      value: ['VADESI_GELDI', 'GECIKMIS'],
    },
  ],
  fields: [
    {
      universalIdentifier: 'b47634ec-5ee1-4a22-b4c9-6fe8539259a1',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStage,
      position: 0,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'af8d7092-9a31-4f25-aceb-a6de8d69ae2e',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStatus,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '9a184508-160c-45dc-9a7a-cd2eae6df38b',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.lastTouchedAt,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
});
