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
      universalIdentifier: '96062c9e-0000-4000-8000-58eabacc0001',
      // person's standard label field — Twenty does not add it by itself
      fieldMetadataUniversalIdentifier: '20202020-3875-44d5-8c33-a6239011cab8',
      position: -1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '96062c9e-0000-4000-8000-58eabacc0002',
      // person's standard phones field
      fieldMetadataUniversalIdentifier: '20202020-0638-448e-8825-439134618022',
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'b47634ec-5ee1-4a22-b4c9-6fe8539259a1',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStage,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'af8d7092-9a31-4f25-aceb-a6de8d69ae2e',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.followUpStatus,
      position: 2,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '9a184508-160c-45dc-9a7a-cd2eae6df38b',
      fieldMetadataUniversalIdentifier: PERSON_FOLLOW_UP_FIELD_IDS.lastTouchedAt,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
});
