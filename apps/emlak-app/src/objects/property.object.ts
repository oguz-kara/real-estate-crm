import { defineObject, FieldType, NumberDataType } from 'twenty-sdk/define';

import {
  PROPERTY_FIELD_IDS,
  PROPERTY_UNIVERSAL_IDENTIFIER,
  type PropertyFieldName,
} from 'src/constants/property-field-ids';
import {
  type LocalizedText,
  metadataLabel,
} from 'src/constants/app-locale';
import {
  PROPERTY_MULTI_SELECT_OPTIONS,
  PROPERTY_SELECT_OPTIONS,
} from 'src/constants/property-options';

export { PROPERTY_UNIVERSAL_IDENTIFIER };

const selectField = (
  name: PropertyFieldName,
  label: LocalizedText,
  icon: string,
  defaultValue?: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.SELECT as const,
  label: metadataLabel(label),
  icon,
  options: [...PROPERTY_SELECT_OPTIONS[name]],
  ...(defaultValue === undefined ? {} : { defaultValue }),
});

const multiSelectField = (
  name: PropertyFieldName,
  label: LocalizedText,
  icon: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.MULTI_SELECT as const,
  label: metadataLabel(label),
  icon,
  options: [...PROPERTY_MULTI_SELECT_OPTIONS[name]],
});

const intField = (name: PropertyFieldName, label: LocalizedText, icon: string) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.NUMBER as const,
  label: metadataLabel(label),
  icon,
  universalSettings: { dataType: NumberDataType.INT },
});

const textField = (name: PropertyFieldName, label: LocalizedText, icon: string) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.TEXT as const,
  label: metadataLabel(label),
  icon,
});

const booleanField = (
  name: PropertyFieldName,
  label: LocalizedText,
  icon: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.BOOLEAN as const,
  label: metadataLabel(label),
  icon,
});

const currencyField = (
  name: PropertyFieldName,
  label: LocalizedText,
  icon: string,
) => ({
  universalIdentifier: PROPERTY_FIELD_IDS[name],
  name,
  type: FieldType.CURRENCY as const,
  label: metadataLabel(label),
  icon,
  defaultValue: { amountMicros: null, currencyCode: "'TRY'" },
});

export default defineObject({
  universalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
  nameSingular: 'property',
  namePlural: 'properties',
  labelSingular: metadataLabel({ tr: 'Portföy', en: 'Property' }),
  labelPlural: metadataLabel({ tr: 'Portföyler', en: 'Properties' }),
  description: metadataLabel({
    tr: 'Sahibinden şemasıyla uyumlu emlak portföyü',
    en: 'Real-estate listing aligned with the sahibinden schema',
  }),
  icon: 'IconBuildingCommunity',
  fields: [
    // core
    {
      ...textField('externalId', { tr: 'İlan No', en: 'Listing No' }, 'IconHash'),
      description: metadataLabel({ tr: 'Kaynak sistemdeki benzersiz ilan kimliği', en: 'Unique listing id in the source system' }),
    },
    selectField('externalSource', { tr: 'Kaynak', en: 'Source' }, 'IconDatabaseImport', "'MANUAL'"),
    selectField('category', { tr: 'Kategori', en: 'Category' }, 'IconCategory'),
    selectField('subType', { tr: 'Emlak Tipi', en: 'Property Type' }, 'IconHome'),
    selectField('listingType', { tr: 'İlan Tipi', en: 'Listing Type' }, 'IconTag'),
    selectField('status', { tr: 'Durum', en: 'Status' }, 'IconCircleCheck', "'ACTIVE'"),
    currencyField('price', { tr: 'Fiyat', en: 'Price' }, 'IconCurrencyLira'),
    textField('city', { tr: 'İl', en: 'City' }, 'IconMapPin'),
    textField('district', { tr: 'İlçe', en: 'District' }, 'IconMapPin'),
    textField('neighborhood', { tr: 'Mahalle', en: 'Neighborhood' }, 'IconMapPin'),
    {
      universalIdentifier: PROPERTY_FIELD_IDS.latitude,
      name: 'latitude',
      type: FieldType.NUMBER as const,
      label: metadataLabel({ tr: 'Enlem', en: 'Latitude' }),
      icon: 'IconWorldLatitude',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.longitude,
      name: 'longitude',
      type: FieldType.NUMBER as const,
      label: metadataLabel({ tr: 'Boylam', en: 'Longitude' }),
      icon: 'IconWorldLongitude',
    },
    intField('sqmGross', { tr: 'Brüt m²', en: 'Gross m²' }, 'IconRulerMeasure'),
    intField('sqmNet', { tr: 'Net m²', en: 'Net m²' }, 'IconRuler'),
    {
      ...textField('description', { tr: 'Açıklama', en: 'Description' }, 'IconFileDescription'),
      isSearchable: true,
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.imageFiles,
      name: 'imageFiles',
      type: FieldType.ARRAY as const,
      label: metadataLabel({ tr: 'Görsel Dosyaları', en: 'Image Files' }),
      icon: 'IconPhoto',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.videoFiles,
      name: 'videoFiles',
      type: FieldType.ARRAY as const,
      label: metadataLabel({ tr: 'Video Dosyaları', en: 'Video Files' }),
      icon: 'IconVideo',
    },
    {
      universalIdentifier: PROPERTY_FIELD_IDS.importNotes,
      name: 'importNotes',
      type: FieldType.RAW_JSON as const,
      label: metadataLabel({ tr: 'Import Notları', en: 'Import Notes' }),
      icon: 'IconNotes',
      description: metadataLabel({ tr: 'Import sırasında eşlenemeyen ham anahtar ve değerler', en: 'Raw keys and values the import could not map' }),
    },
    // konut / shared structural
    selectField('rooms', { tr: 'Oda Sayısı', en: 'Rooms' }, 'IconDoor'),
    selectField('buildingAge', { tr: 'Bina Yaşı', en: 'Building Age' }, 'IconCalendar'),
    selectField('floorLocation', { tr: 'Bulunduğu Kat', en: 'Floor' }, 'IconStairs'),
    intField('totalFloors', { tr: 'Kat Sayısı', en: 'Total Floors' }, 'IconBuilding'),
    selectField('heating', { tr: 'Isıtma', en: 'Heating' }, 'IconFlame'),
    intField('bathroomCount', { tr: 'Banyo Sayısı', en: 'Bathrooms' }, 'IconBath'),
    booleanField('balcony', { tr: 'Balkon', en: 'Balcony' }, 'IconWindow'),
    booleanField('furnished', { tr: 'Eşyalı', en: 'Furnished' }, 'IconSofa'),
    currencyField('dues', { tr: 'Aidat', en: 'Dues' }, 'IconReceipt'),
    selectField('creditEligible', { tr: 'Krediye Uygun', en: 'Mortgage Eligible' }, 'IconCreditCard'),
    selectField('deedStatus', { tr: 'Tapu Durumu', en: 'Deed Status' }, 'IconCertificate'),
    selectField('fromWho', { tr: 'Kimden', en: 'Listed By' }, 'IconUserCheck'),
    booleanField('exchangeable', { tr: 'Takas', en: 'Exchange' }, 'IconArrowsExchange'),
    booleanField('inSite', { tr: 'Site İçerisinde', en: 'In a Complex' }, 'IconBuildingCommunity'),
    textField('siteName', { tr: 'Site Adı', en: 'Complex Name' }, 'IconSignature'),
    selectField('usageStatus', { tr: 'Kullanım Durumu', en: 'Occupancy Status' }, 'IconKey'),
    selectField('kitchenType', { tr: 'Mutfak', en: 'Kitchen' }, 'IconToolsKitchen2'),
    intField('buildingAgeYears', { tr: 'Bina Yaşı (Yıl)', en: 'Building Age (Years)' }, 'IconCalendarStats'),
    selectField('buildingCondition', { tr: 'Yapının Durumu', en: 'Building Condition' }, 'IconHammer'),
    textField('immovableNumber', { tr: 'Taşınmaz Numarası', en: 'Immovable Number' }, 'IconId'),
    currencyField('deposit', { tr: 'Depozito', en: 'Deposit' }, 'IconCash'),
    // isyeri
    currencyField('transferFee', { tr: 'Devren Bedeli', en: 'Transfer Fee' }, 'IconTransfer'),
    intField('openAreaSqm', { tr: 'Açık Alan m²', en: 'Open Area m²' }, 'IconSun'),
    intField('closedAreaSqm', { tr: 'Kapalı Alan m²', en: 'Closed Area m²' }, 'IconBox'),
    intField('sectionRoomCount', { tr: 'Bölüm & Oda Sayısı', en: 'Sections & Rooms' }, 'IconDoorEnter'),
    intField('bedCount', { tr: 'Yatak Sayısı', en: 'Beds' }, 'IconBed'),
    // arsa
    selectField('zoningStatus', { tr: 'İmar Durumu', en: 'Zoning Status' }, 'IconMap'),
    textField('blockNo', { tr: 'Ada No', en: 'Block No' }, 'IconGrid4x4'),
    textField('parcelNo', { tr: 'Parsel No', en: 'Parcel No' }, 'IconGridDots'),
    textField('kaks', { tr: 'Kaks (Emsal)', en: 'Floor Area Ratio' }, 'IconPercentage'),
    textField('gabari', { tr: 'Gabari', en: 'Height Limit' }, 'IconArrowAutofitHeight'),
    currencyField('pricePerSqm', { tr: 'm² Fiyatı', en: 'Price per m²' }, 'IconCalculator'),
    // amenities
    multiSelectField('facade', { tr: 'Cephe', en: 'Facade' }, 'IconCompass'),
    multiSelectField('businessFeatures', { tr: 'İşyeri & Tesis Özellikleri', en: 'Business & Facility Features' }, 'IconBriefcase'),
    multiSelectField('interiorFeatures', { tr: 'İç Özellikler', en: 'Interior Features' }, 'IconArmchair'),
    multiSelectField('exteriorFeatures', { tr: 'Dış Özellikler', en: 'Exterior Features' }, 'IconBuildingSkyscraper'),
    multiSelectField('neighborhoodFeatures', { tr: 'Muhit', en: 'Surroundings' }, 'IconMapSearch'),
    multiSelectField('transportFeatures', { tr: 'Ulaşım', en: 'Transport' }, 'IconBus'),
    multiSelectField('view', { tr: 'Manzara', en: 'View' }, 'IconEye'),
    multiSelectField('infrastructure', { tr: 'Altyapı', en: 'Infrastructure' }, 'IconPlug'),
  ],
});
