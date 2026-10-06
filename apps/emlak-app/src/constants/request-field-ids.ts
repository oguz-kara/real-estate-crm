// Stable identifiers for the buyerRequest and propertyMatch entities.
export const BUYER_REQUEST_UNIVERSAL_IDENTIFIER = '6123c97b-5e2e-4049-a0c9-09cb70e4b6ab';
export const PROPERTY_MATCH_UNIVERSAL_IDENTIFIER = '06f37a9c-5cf5-450c-8ed8-92b1f25b146e';

export const BUYER_REQUEST_FIELD_IDS = {
  status: 'fdd572ef-68b7-4054-a396-e62d96c896a6',
  category: '53ffa59d-638b-447b-b8eb-8a4536fabaa7',
  listingType: '8f1aec44-e1fb-4acf-9256-522f4f91f739',
  budgetMax: 'f965086d-7c4b-4e0b-9efd-da2ad3cf7797',
  budgetMin: '019fa9ff-3ae6-401e-b3f6-478767dc8f5f',
  districts: '51846bc3-9c5f-425e-9c21-d2964e42f7ba',
  rooms: 'fdca100d-d8c7-4ddd-92ba-58fdcbd8bddc',
  excludedFeatures: '3f56aebc-aabe-45e3-91b5-1db307a2cb45',
  features: 'e3e26cc9-a1b0-4a0e-80f4-eb6684ae25be',
  sqmNetMin: '14658a84-4de8-4cdb-9de6-de28c57f9ac5',
  notes: 'f31262e7-9c75-468f-8677-f9471af7a4a4',
  buyer: '77c93dd0-0a88-4b1a-b739-6624364b3eb0',
  matches: '29551d95-54ce-4c2e-8c5b-58e23ba57705',
} as const;

export const PERSON_BUYER_REQUESTS_FIELD_ID = 'a2a63d32-1f2f-4377-ab6d-e9dc709306c0';

export const PROPERTY_MATCH_FIELD_IDS = {
  score: '050a80eb-91d6-438b-82e8-f4ab93c1ccd1',
  status: '7acc74dc-02e2-4f07-9a4e-c631bb18a9c1',
  request: 'de7a763f-bf6e-4b35-85e8-4dbcfde55401',
  property: '68b161c3-3dcd-4383-bd93-eab0a8ffa5c9',
} as const;

export const PROPERTY_MATCHES_FIELD_ID = 'c29e3273-1313-4399-b7cb-d4de5083f165';

export const PROPERTY_MATCH_UNIQUE_INDEX = {
  index: '4e4d82c3-dbaf-4e33-ba03-4681e59c62b1',
  requestField: '8e58eca5-0d41-4857-bb51-c4defbcc1a81',
  propertyField: 'a67034b6-37a4-4420-99fc-21da99be0ac5',
} as const;

export const AKTIF_TALEPLER_VIEW_ID = '2e85cb3d-6082-4a23-a878-ff125195e9f8';
export const YENI_ESLESMELER_VIEW_ID = '2ffee36a-0ba3-4a19-ac22-15bcf4f17b70';
export const BUYER_REQUESTS_NAV_ITEM_ID = '1740a26d-9739-45fa-b49e-012c4b689064';
