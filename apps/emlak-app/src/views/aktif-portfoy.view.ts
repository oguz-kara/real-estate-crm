import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import { PROPERTY_FIELD_IDS, PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';

export default defineView({
  universalIdentifier: '7aff88a2-1ee4-45e5-856a-c8763ba1e8b0',
  name: resolveLabel({ tr: 'Aktif Portföy', en: 'Active Portfolio' }),
  objectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCircleCheck',
  position: 4,
  filters: [
    {
      universalIdentifier: '14e62f87-19b6-470d-8b62-f7d3617964c1',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.status,
      operand: ViewFilterOperand.IS,
      value: ['ACTIVE'],
    },
  ],
  fields: [
    {
      universalIdentifier: '82715203-e3cf-4a6f-acd5-2c67ae1cde33',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.category,
      position: 0,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '638a4d73-1e44-4a5d-9b33-85224b386258',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.listingType,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '42c9caea-3e17-4a07-b1f2-8e9363c6bbf0',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.price,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '57cb630a-b9c4-4461-8001-1d05ec4925d3',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.district,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '370ba7db-af4a-448b-be2c-a19b64f6dcf6',
      fieldMetadataUniversalIdentifier: PROPERTY_FIELD_IDS.rooms,
      position: 4,
      isVisible: true,
      size: 100,
    },
  ],
});
