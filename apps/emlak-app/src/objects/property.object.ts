import { defineObject, FieldType, NumberDataType } from 'twenty-sdk/define';

import {
  PROPERTY_FIELD_IDS,
  PROPERTY_UNIVERSAL_IDENTIFIER,
  type PropertyFieldName,
} from 'src/constants/property-field-ids';
import {
  PROPERTY_MULTI_SELECT_OPTIONS,
  PROPERTY_SELECT_OPTIONS,
} from 'src/constants/property-options';

export { PROPERTY_UNIVERSAL_IDENTIFIER };

const selectField = (
  name: PropertyFieldName,
  label: string,
  icon: string,
  defaultValue?: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.SELECT as const,
  label,
  icon,
  options: [...PROPERTY_SELECT_OPTIONS[name]],
  ...(defaultValue === undefined ? {} : { defaultValue }),
});

const multiSelectField = (
  name: PropertyFieldName,
  label: string,
  icon: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.MULTI_SELECT as const,
  label,
  icon,
  options: [...PROPERTY_MULTI_SELECT_OPTIONS[name]],
});

const intField = (name: PropertyFieldName, label: string, icon: string) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.NUMBER as const,
  label,
  icon,
  universalSettings: { dataType: NumberDataType.INT },
});

const textField = (name: PropertyFieldName, label: string, icon: string) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.TEXT as const,
  label,
  icon,
});

const booleanField = (
  name: PropertyFieldName,
  label: string,
  icon: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.BOOLEAN as const,
  label,
  icon,
});

const currencyField = (
  name: PropertyFieldName,
  label: string,
  icon: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.CURRENCY as const,
  label,
  icon,
  defaultValue: { amountMicros: null, currencyCode: "'TRY'" },
});

export default defineObject({
  universalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  nameSingular: 'property',
  namePlural: 'properties',
  labelSingular: 'Portföy',
  labelPlural: 'Portföyler',
  description: 'Sahibinden şemasıyla uyumlu emlak portföyü',
  icon: 'IconBuildingCommunity',
  fields: [
    // core
    {
      ...textField('externalId', 'İlan No', 'IconHash'),
      description: 'Kaynak sistemdeki benzersiz ilan kimliği',
    },
    selectField('externalSource', 'Kaynak', 'IconDatabaseImport', "'MANUAL'"),
    selectField('category', 'Kategori', 'IconCategory'),
    selectField('subType', 'Emlak Tipi', 'IconHome'),
    selectField('listingType', 'İlan Tipi', 'IconTag'),
    selectField('status', 'Durum', 'IconCircleCheck', "'ACTIVE'"),
    currencyField('price', 'Fiyat', 'IconCurrencyLira'),
    textField('city', 'İl', 'IconMapPin'),
    textField('district', 'İlçe', 'IconMapPin'),
    textField('neighborhood', 'Mahalle', 'IconMapPin'),
    {
      universalIdentifier: PROPERTY_FIELD_IDS.latitude,
      name: 'latitude',
      type: FieldType.NUMBER as const,
      label: 'Enlem',
      icon: 'IconWorldLatitude',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.longitude,
      name: 'longitude',
      type: FieldType.NUMBER as const,
      label: 'Boylam',
      icon: 'IconWorldLongitude',
    },
    intField('sqmGross', 'Brüt m²', 'IconRulerMeasure'),
    intField('sqmNet', 'Net m²', 'IconRuler'),
    {
      ...textField('description', 'Açıklama', 'IconFileDescription'),
      isSearchable: true,
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.imageFiles,
      name: 'imageFiles',
      type: FieldType.ARRAY as const,
      label: 'Görsel Dosyaları',
      icon: 'IconPhoto',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.videoFiles,
      name: 'videoFiles',
      type: FieldType.ARRAY as const,
      label: 'Video Dosyaları',
      icon: 'IconVideo',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.importNotes,
      name: 'importNotes',
      type: FieldType.RAW_JSON as const,
      label: 'Import Notları',
      icon: 'IconNotes',
      description: 'Import sırasında eşlenemeyen ham anahtar ve değerler',
    },
    // konut / shared structural
    selectField('rooms', 'Oda Sayısı', 'IconDoor'),
    selectField('buildingAge', 'Bina Yaşı', 'IconCalendar'),
    selectField('floorLocation', 'Bulunduğu Kat', 'IconStairs'),
    intField('totalFloors', 'Kat Sayısı', 'IconBuilding'),
    selectField('heating', 'Isıtma', 'IconFlame'),
    intField('bathroomCount', 'Banyo Sayısı', 'IconBath'),
    booleanField('balcony', 'Balkon', 'IconWindow'),
    booleanField('furnished', 'Eşyalı', 'IconSofa'),
    currencyField('dues', 'Aidat', 'IconReceipt'),
    selectField('creditEligible', 'Krediye Uygun', 'IconCreditCard'),
    selectField('deedStatus', 'Tapu Durumu', 'IconCertificate'),
    selectField('fromWho', 'Kimden', 'IconUserCheck'),
    booleanField('exchangeable', 'Takas', 'IconArrowsExchange'),
    booleanField('inSite', 'Site İçerisinde', 'IconBuildingCommunity'),
    textField('siteName', 'Site Adı', 'IconSignature'),
    selectField('usageStatus', 'Kullanım Durumu', 'IconKey'),
    // isyeri
    currencyField('transferFee', 'Devren Bedeli', 'IconTransfer'),
    // arsa
    selectField('zoningStatus', 'İmar Durumu', 'IconMap'),
    textField('blockNo', 'Ada No', 'IconGrid4x4'),
    textField('parcelNo', 'Parsel No', 'IconGridDots'),
    textField('kaks', 'Kaks (Emsal)', 'IconPercentage'),
    textField('gabari', 'Gabari', 'IconArrowAutofitHeight'),
    currencyField('pricePerSqm', 'm² Fiyatı', 'IconCalculator'),
    // amenities
    multiSelectField('interiorFeatures', 'İç Özellikler', 'IconArmchair'),
    multiSelectField('exteriorFeatures', 'Dış Özellikler', 'IconBuildingSkyscraper'),
    multiSelectField('neighborhoodFeatures', 'Muhit', 'IconMapSearch'),
    multiSelectField('transportFeatures', 'Ulaşım', 'IconBus'),
    multiSelectField('view', 'Manzara', 'IconEye'),
    multiSelectField('infrastructure', 'Altyapı', 'IconPlug'),
  ],
});
