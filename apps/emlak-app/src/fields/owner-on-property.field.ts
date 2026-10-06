import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/objects/property.object';

export const OWNER_FIELD_ID = 'a3e0a4dd-eb19-41c8-9a77-eb035180b55d';
export const OWNED_PROPERTIES_FIELD_ID = 'bfdbb77f-9efe-42dd-a0b6-b7f10bdf84a5';

export default defineField({
  universalIdentifier: OWNER_FIELD_ID,
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Mal Sahibi',
  description: 'Portföyün mal sahibi',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: OWNED_PROPERTIES_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
