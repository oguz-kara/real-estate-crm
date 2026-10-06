import {
  defineField,
  FieldType,
  OnDeleteAction,
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
  universalIdentifier: BUYER_REQUEST_FIELD_IDS.buyer,
  objectUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'buyer',
  label: resolveLabel({ tr: 'Alıcı', en: 'Buyer' }),
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: PERSON_BUYER_REQUESTS_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'buyerId',
  },
});
