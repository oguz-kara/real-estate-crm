import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import {
  BUYER_REQUEST_FIELD_IDS,
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  PROPERTY_MATCH_FIELD_IDS,
  PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
} from 'src/constants/request-field-ids';

export default defineField({
  universalIdentifier: BUYER_REQUEST_FIELD_IDS.matches,
  objectUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'matches',
  label: resolveLabel({ tr: 'Eşleşmeler', en: 'Matches' }),
  icon: 'IconArrowsLeftRight',
  relationTargetObjectMetadataUniversalIdentifier: PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.request,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
