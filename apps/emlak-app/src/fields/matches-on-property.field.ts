import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';
import {
  PROPERTY_MATCH_FIELD_IDS,
  PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  PROPERTY_MATCHES_FIELD_ID,
} from 'src/constants/request-field-ids';

export default defineField({
  universalIdentifier: PROPERTY_MATCHES_FIELD_ID,
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'matches',
  label: resolveLabel({ tr: 'Talip Talepler', en: 'Matching Requests' }),
  icon: 'IconUserSearch',
  relationTargetObjectMetadataUniversalIdentifier: PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.property,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
