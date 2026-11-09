import { defineIndex, IndexType } from 'twenty-sdk/define';

import { PROPERTY_FIELD_IDS, PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';

export default defineIndex({
  universalIdentifier: '96062c9e-dd91-4ac1-8772-7f5e0c42ac1e',
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  indexType: IndexType.BTREE,
  fields: [
    {
      universalIdentifier: 'd352f800-c6a8-4ebf-9084-2605fa903dfe',
      fieldUniversalIdentifier: PROPERTY_FIELD_IDS.externalId,
    },
  ],
});
