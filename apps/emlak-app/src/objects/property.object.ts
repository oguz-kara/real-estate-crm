import { defineObject, FieldType } from 'twenty-sdk/define';

export const PROPERTY_UNIVERSAL_IDENTIFIER = 'be5c8200-281d-4889-8794-3f0cb232b5c0';

export const PROPERTY_FIELD_IDS = {
  propertyType: '777be1d2-59f8-480a-9278-5457f4b44b6e',
  listingType: '58241732-735f-45e8-8de4-6a7fefe82834',
  status: '0e790154-8325-4308-b764-f5b38eee0343',
  price: 'b3783629-3975-4b07-98dd-19f2b909420a',
  address: '0ee7f39b-abc9-4193-a5dd-c3ef0b9fa579',
  rooms: 'b28ea39c-03c1-44bd-82c7-a2da49560045',
  areaNet: '03332cb2-1598-435a-ab25-36a41db76a3e',
  areaGross: 'b5380694-1bb2-4d75-bc9a-d9b81cf46fef',
  description: '8247f514-1cb2-4724-85ca-13c1bb78e6e7',
} as const;

export default defineObject({
  universalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  nameSingular: 'property',
  namePlural: 'properties',
  labelSingular: 'Portföy',
  labelPlural: 'Portföyler',
  description: 'Satılık veya kiralık emlak portföyü',
  icon: 'IconBuildingCommunity',
  fields: [
    {
      universalIdentifier: PROPERTY_FIELD_IDS.propertyType,
      name: 'propertyType',
      type: FieldType.SELECT,
      label: 'Emlak Tipi',
      icon: 'IconCategory',
      options: [
        { value: 'APARTMENT', label: 'Daire', position: 0, color: 'blue' },
        { value: 'VILLA', label: 'Villa', position: 1, color: 'green' },
        { value: 'LAND', label: 'Arsa', position: 2, color: 'yellow' },
        { value: 'OFFICE', label: 'Ofis', position: 3, color: 'purple' },
        { value: 'SHOP', label: 'Dükkan', position: 4, color: 'orange' },
      ],
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.listingType,
      name: 'listingType',
      type: FieldType.SELECT,
      label: 'İlan Tipi',
      icon: 'IconTag',
      options: [
        { value: 'SALE', label: 'Satılık', position: 0, color: 'green' },
        { value: 'RENT', label: 'Kiralık', position: 1, color: 'blue' },
      ],
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.status,
      name: 'status',
      type: FieldType.SELECT,
      label: 'Durum',
      icon: 'IconCircleCheck',
      defaultValue: "'ACTIVE'",
      options: [
        { value: 'ACTIVE', label: 'Aktif', position: 0, color: 'green' },
        { value: 'OPTIONED', label: 'Opsiyonlu', position: 1, color: 'yellow' },
        { value: 'SOLD', label: 'Satıldı', position: 2, color: 'gray' },
        { value: 'RENTED', label: 'Kiralandı', position: 3, color: 'purple' },
        { value: 'PASSIVE', label: 'Pasif', position: 4, color: 'gray' },
      ],
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.price,
      name: 'price',
      type: FieldType.CURRENCY,
      label: 'Fiyat',
      icon: 'IconCurrencyLira',
      defaultValue: { amountMicros: null, currencyCode: "'TRY'" },
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.address,
      name: 'propertyAddress',
      type: FieldType.ADDRESS,
      label: 'Adres',
      icon: 'IconMapPin',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.rooms,
      name: 'rooms',
      type: FieldType.TEXT,
      label: 'Oda Sayısı',
      description: 'Örn. 3+1, 2+1',
      icon: 'IconDoor',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.areaNet,
      name: 'areaNet',
      type: FieldType.NUMBER,
      label: 'Net m²',
      icon: 'IconRuler',
      universalSettings: { dataType: 'int' },
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.areaGross,
      name: 'areaGross',
      type: FieldType.NUMBER,
      label: 'Brüt m²',
      icon: 'IconRulerMeasure',
      universalSettings: { dataType: 'int' },
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.description,
      name: 'description',
      type: FieldType.TEXT,
      label: 'Açıklama',
      icon: 'IconFileDescription',
    },
  ],
});
