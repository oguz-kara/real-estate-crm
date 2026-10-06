import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import {
  AKTIF_TALEPLER_VIEW_ID,
  BUYER_REQUEST_FIELD_IDS,
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
} from 'src/constants/request-field-ids';

export default defineView({
  universalIdentifier: AKTIF_TALEPLER_VIEW_ID,
  name: resolveLabel({ tr: 'Aktif Talepler', en: 'Active Requests' }),
  objectUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconUserSearch',
  position: 1,
  filters: [
    {
      universalIdentifier: 'b297b4a6-0658-42bf-8dcf-f7bfef3cb733',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.status,
      operand: ViewFilterOperand.IS,
      value: ['AKTIF'],
    },
  ],
  fields: [
    {
      universalIdentifier: 'a79ba035-af02-44b3-a6f8-93fa77eb11fc',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.buyer,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'f491499f-3da3-4a81-8705-dc97c184bbea',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.category,
      position: 1,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'c3317935-0b24-48d3-8a6d-ae70548d6fb1',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.listingType,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: '85421d96-e4d3-4670-a814-961574b5788f',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.budgetMax,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'abba4872-5103-4c00-bfc6-8011c0e396f6',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.districts,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
