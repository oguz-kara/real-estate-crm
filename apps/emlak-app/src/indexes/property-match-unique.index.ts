import { defineIndex, IndexType } from 'twenty-sdk/define';

import {
  PROPERTY_MATCH_FIELD_IDS,
  PROPERTY_MATCH_UNIQUE_INDEX,
  PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
} from 'src/constants/request-field-ids';

// a (request, property) pair is born exactly once — notification dedupe
// rests on this index, not on bookkeeping
export default defineIndex({
  universalIdentifier: PROPERTY_MATCH_UNIQUE_INDEX.index,
  objectUniversalIdentifier: PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  indexType: IndexType.BTREE,
  fields: [
    {
      universalIdentifier: PROPERTY_MATCH_UNIQUE_INDEX.requestField,
      fieldUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.request,
    },
    {
      universalIdentifier: PROPERTY_MATCH_UNIQUE_INDEX.propertyField,
      fieldUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.property,
    },
  ],
});
