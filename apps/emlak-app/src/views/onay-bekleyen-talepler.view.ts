import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { metadataLabel } from 'src/constants/app-locale';
import {
  BUYER_REQUEST_FIELD_IDS,
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  ONAY_BEKLEYEN_TALEPLER_VIEW_ID,
} from 'src/constants/request-field-ids';

export default defineView({
  universalIdentifier: ONAY_BEKLEYEN_TALEPLER_VIEW_ID,
  name: metadataLabel({ tr: 'Onay Bekleyen Talepler', en: 'Requests Awaiting Approval' }),
  objectUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconClipboardCheck',
  position: 2,
  filters: [
    {
      universalIdentifier: '7c1f0a29-f78e-461e-a3b9-eaa6b6c2a369',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.status,
      operand: ViewFilterOperand.IS,
      value: ['TASLAK'],
    },
  ],
  fields: [
    {
      universalIdentifier: '8bac4085-227c-494e-973b-3520be98c01d',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.buyer,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '3aa4591d-c778-4b74-9614-80eea148cde0',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.source,
      position: 1,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: '115aa949-c913-401d-9e61-e1c0c192830f',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.listingType,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'a929cfb5-9d00-4bbe-b197-4bfba158fc16',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.category,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: '2e8591da-69cf-452b-9670-45ece2905b2a',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.districts,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '4a7f98cc-da90-4537-b105-0e6a098e133b',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.budgetMax,
      position: 5,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '2a0e6b52-dd72-455c-a573-9d4e728c0775',
      fieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.rooms,
      position: 6,
      isVisible: true,
      size: 120,
    },
  ],
});
