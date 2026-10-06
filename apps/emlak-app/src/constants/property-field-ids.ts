// Stable universal identifiers: never change a value after it has been applied
// to a workspace — the sync identifies fields by these, not by name.
export const PROPERTY_UNIVERSAL_IDENTIFIER = 'be5c8200-281d-4889-8794-3f0cb232b5c0';

export const PROPERTY_FIELD_IDS = {
  // core
  externalId: '6f008da6-c9f7-4df6-b7dd-f7c8cebdda75',
  externalSource: '6ef8ca8a-50dd-410e-b099-107dc926bbf6',
  category: 'f5169d07-6f61-4602-b162-2be8ca8baa58',
  subType: '553e831d-5103-411b-9c80-cb0d85934549',
  listingType: '58241732-735f-45e8-8de4-6a7fefe82834',
  status: '0e790154-8325-4308-b764-f5b38eee0343',
  price: 'b3783629-3975-4b07-98dd-19f2b909420a',
  city: '1f349889-e732-433a-b3ff-4832e1dd7b08',
  district: 'df4d4bb0-e6f3-4320-9664-1ad220edc44c',
  neighborhood: 'fe871ead-253b-4647-b446-42a64e7c5aef',
  latitude: '4a2e6e70-88f9-46d4-896e-7a792d3f9bb0',
  longitude: '8d4b2e80-facc-4a95-a42d-c0c69eab847b',
  sqmGross: '3eccb786-60f1-4a52-a7a1-11d8567a6f5d',
  sqmNet: '43b341b5-c389-497e-94d5-75991b8ff072',
  description: '8247f514-1cb2-4724-85ca-13c1bb78e6e7',
  imageFiles: 'ba4ed221-c06c-4a3f-ab96-d14f80985498',
  videoFiles: 'e71f18bb-17e7-4689-ad3c-6ee627d4a0db',
  importNotes: 'fc771457-b960-488d-82e0-39c53e2c0fb3',
  // konut / shared structural
  rooms: 'bd6df3e1-0c2a-419a-8792-d5d896511ea9',
  buildingAge: '3ca86248-b042-41fa-9442-cfeaaa9ece9c',
  floorLocation: '05a8b565-303d-4e95-8baa-d04db52f65e9',
  totalFloors: 'aa180831-1052-4c2d-a420-84558d64946c',
  heating: '9d78848d-d00a-4867-a21e-17f0d765cc3a',
  bathroomCount: '28544354-cce8-49df-833b-63c9649ec2a3',
  balcony: '964e7797-2dd8-4b28-a542-9d049ac829f1',
  furnished: '90dbc7bb-9c2a-40fd-867a-3be6532e74ab',
  dues: 'a9789eb6-ebcc-457e-b35d-f01c9120a842',
  creditEligible: 'b039335a-25f0-4032-9fa8-69ef976fcddf',
  deedStatus: 'a90e68a0-81a2-4eeb-8f84-a0475c39a9a3',
  fromWho: '44d988eb-e040-4770-afe9-e769d923fa52',
  exchangeable: '89dd8ea5-e47d-46c7-ae92-957111674071',
  inSite: 'b0523794-ffa9-4ba8-9807-07a880fa1374',
  siteName: 'e6cc0335-58e3-40a1-98f1-f081c1e65dde',
  usageStatus: '4ca31191-0e76-49fc-a7d2-c647cded8e5e',
  // isyeri
  transferFee: '25401b34-c024-4a76-8bdd-5807468f0540',
  // arsa
  zoningStatus: 'a0c5c181-74b2-4bfe-91ae-f452c464ce40',
  blockNo: '536ad4a4-6315-4a46-995e-153559345f8f',
  parcelNo: '05b0e434-8324-4397-ba5d-6c663b943c33',
  kaks: '9906287f-00a2-4a8d-90cc-ea771a2d86fd',
  gabari: '5d2c92fd-1540-4725-b573-4a4869da8ae3',
  pricePerSqm: '2cbdd642-ed99-4d36-92db-38639986ba51',
  // amenities
  interiorFeatures: '604a8d8f-7a47-4269-90da-93bd845e7b9f',
  exteriorFeatures: '9d7c8cb1-72f5-4aae-926c-12ebe30227d2',
  neighborhoodFeatures: 'aafad305-6758-4190-a805-983b22beecb9',
  transportFeatures: '8b87b58f-2105-4359-804c-30e5acc9041a',
  view: 'dc12cb6e-8344-4d4f-894c-5e1c14d381b7',
  infrastructure: '94f4128b-ff44-4175-a8a4-79576d238f4b',
} as const;

export type PropertyFieldName = keyof typeof PROPERTY_FIELD_IDS;
