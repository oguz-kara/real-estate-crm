import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import {
  BUYER_REQUEST_FIELD_IDS,
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  PERSON_BUYER_REQUESTS_FIELD_ID,
} from 'src/constants/request-field-ids';

export default defineField({
  universalIdentifier: PERSON_BUYER_REQUESTS_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'buyerRequests',
  label: resolveLabel({ tr: 'Talepleri', en: 'Buyer Requests' }),
  icon: 'IconUserSearch',
  relationTargetObjectMetadataUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.buyer,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
