import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PROPERTY_FIELD_IDS, PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';

export default defineView({
  universalIdentifier: 'b3afae8e-0d7e-4729-8dcf-c3c2efb94713',
  name: resolveLabel({ tr: 'Kiralık Konut', en: 'For Rent — Residential' }),
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconKey',
  position: 2,
  filters: [
    {
      universalIdentifier: '18657fa3-442c-4963-9b29-8a985c19019d',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.listingType,
      operand: ViewFilterOperand.IS,
      value: ['KIRALIK'],
    },
    {
      universalIdentifier: '51f89349-2398-4ebf-86bb-95bc51b8e95a',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.category,
      operand: ViewFilterOperand.IS,
      value: ['KONUT'],
    },
  ],
  fields: [
    {
      universalIdentifier: 'c5ea44c9-76e8-4d73-954f-9c4895a2242b',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.price,
      position: 0,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '562ce14c-82c8-456f-8ee1-9a1e69fb9991',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.district,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '4521298e-4599-4ea5-b3d6-9771a60fc4c5',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.neighborhood,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'c37d2ebc-7cc0-4093-b28e-f9698340b9fd',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.rooms,
      position: 3,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '57b026df-f587-4f6a-9152-09733e0ad2ad',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.furnished,
      position: 4,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: 'c6b43848-341a-4eb7-9419-36addfc4a02d',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.status,
      position: 5,
      isVisible: true,
      size: 120,
    },
  ],
});
