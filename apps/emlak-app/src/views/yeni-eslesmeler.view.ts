import {
  defineView,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import { metadataLabel } from 'src/constants/app-locale';
import {
  PROPERTY_MATCH_FIELD_IDS,
  PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  YENI_ESLESMELER_VIEW_ID,
} from 'src/constants/request-field-ids';

export default defineView({
  universalIdentifier: YENI_ESLESMELER_VIEW_ID,
  name: metadataLabel({ tr: 'Yeni Eşleşmeler', en: 'New Matches' }),
  objectUniversalIdentifier: PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconSparkles',
  position: 1,
  filters: [
    {
      universalIdentifier: '03466341-1caf-43c5-a6db-244d76c4b5fc',
      fieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.status,
      operand: ViewFilterOperand.IS,
      value: ['YENI'],
    },
  ],
  sorts: [
    {
      universalIdentifier: 'bb1b5fd1-ced8-453b-9aa8-faaebe97c063',
      fieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.score,
      direction: ViewSortDirection.DESC,
    },
  ],
  fields: [
    {
      universalIdentifier: '3e2af6a2-9907-493d-9a1d-6be650aa6679',
      fieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.request,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'f9f46ae9-5b5e-4abb-a09f-b1fe7b1bc4b8',
      fieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.property,
      position: 1,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '81e8eca2-874f-4c77-8675-85c2cce90b59',
      fieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.score,
      position: 2,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: '31cd6a64-8777-4fe0-b309-d44f9eb331c5',
      fieldMetadataUniversalIdentifier: PROPERTY_MATCH_FIELD_IDS.status,
      position: 3,
      isVisible: true,
      size: 130,
    },
  ],
});
