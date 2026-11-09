import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { metadataLabel } from 'src/constants/app-locale';
import { PROPERTY_FIELD_IDS, PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';

export default defineView({
  universalIdentifier: '6e706a22-8b84-4cbb-8f11-e8a8ea1e0d9a',
  name: metadataLabel({ tr: 'Satılık Konut', en: 'For Sale — Residential' }),
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconHome',
  position: 1,
  filters: [
    {
      universalIdentifier: '794ec4fa-7dba-48f6-86ad-6e60c8d4846d',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.listingType,
      operand: ViewFilterOperand.IS,
      value: ['SATILIK'],
    },
    {
      universalIdentifier: 'b3534234-be49-49d9-bc7d-763901543422',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.category,
      operand: ViewFilterOperand.IS,
      value: ['KONUT'],
    },
  ],
  fields: [
    {
      universalIdentifier: '60f02d59-6bc9-4623-b3c8-ece12db13538',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.price,
      position: 0,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'ea027640-bcf7-48d7-8b32-da041423b8c6',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.district,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '30a3ed63-ac83-47bd-8cd8-2feb5d1eb686',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.neighborhood,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'a0ae143c-47e3-4a9a-9129-763ca11472aa',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.rooms,
      position: 3,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '7d53a131-9407-4e7b-876e-cc59b8fdf9f5',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.sqmNet,
      position: 4,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: 'b1f23c09-11a0-4821-82d7-ade8eabbcbb2',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.status,
      position: 5,
      isVisible: true,
      size: 120,
    },
  ],
});
