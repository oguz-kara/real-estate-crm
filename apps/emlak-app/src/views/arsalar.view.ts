import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { metadataLabel } from 'src/constants/app-locale';
import { PROPERTY_FIELD_IDS, PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';

export default defineView({
  universalIdentifier: '3900558f-56f9-471e-8b70-960193a7a2c1',
  name: metadataLabel({ tr: 'Arsalar', en: 'Land' }),
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconMap',
  position: 3,
  filters: [
    {
      universalIdentifier: 'c0ffd5f2-2ff8-4388-9f3e-05df37d0d125',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.category,
      operand: ViewFilterOperand.IS,
      value: ['ARSA'],
    },
  ],
  fields: [
    {
      universalIdentifier: 'cdfe55d5-2578-4e61-80e5-3fd2d8d5eb66',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.price,
      position: 0,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'c0f2590f-17a8-4bf0-a9fc-f4aa8c25c93e',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.district,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '2a020014-8085-42a1-bccf-b796b8233970',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.sqmGross,
      position: 2,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '3cc8c688-286f-4686-97c5-9f2096054246',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.zoningStatus,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '67fe2436-34b9-41c4-b576-863b8a1f84d0',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.pricePerSqm,
      position: 4,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '96009ff7-d1a3-435d-a1bc-079bdbf639c2',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.status,
      position: 5,
      isVisible: true,
      size: 120,
    },
  ],
});
