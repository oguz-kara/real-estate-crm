import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OWNED_PROPERTIES_FIELD_ID,
  OWNER_FIELD_ID,
} from 'src/fields/owner-on-property.field';
import { PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/objects/property.object';

import { metadataLabel } from 'src/constants/app-locale';

export default defineField({
  universalIdentifier: OWNED_PROPERTIES_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ownedProperties',
  label: metadataLabel({ tr: 'Portföyleri', en: 'Owned Properties' }),
  description: metadataLabel({ tr: 'Kişinin mal sahibi olduğu portföyler', en: 'Properties this person owns' }),
  icon: 'IconBuildingCommunity',
  relationTargetObjectMetadataUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: OWNER_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
