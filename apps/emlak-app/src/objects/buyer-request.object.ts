import { defineObject, FieldType, NumberDataType } from 'twenty-sdk/define';

import { resolveLabel } from 'src/constants/app-locale';
import {
  BUYER_REQUEST_FIELD_IDS,
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
} from 'src/constants/request-field-ids';
import { PROPERTY_SELECT_OPTIONS } from 'src/constants/property-options';
import { AMENITY_UNION_OPTIONS } from 'src/constants/request-options';

export { BUYER_REQUEST_UNIVERSAL_IDENTIFIER };

export default defineObject({
  universalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  nameSingular: 'buyerRequest',
  namePlural: 'buyerRequests',
  labelSingular: resolveLabel({ tr: 'Talep', en: 'Buyer Request' }),
  labelPlural: resolveLabel({ tr: 'Talepler', en: 'Buyer Requests' }),
  description: resolveLabel({
    tr: 'Alıcının aradığı portföyün yapılandırılmış tanımı',
    en: "Structured description of what a buyer is looking for",
  }),
  icon: 'IconUserSearch',
  fields: [
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.status,
      name: 'status',
      type: FieldType.SELECT as const,
      label: resolveLabel({ tr: 'Durum', en: 'Status' }),
      icon: 'IconProgress',
      defaultValue: "'AKTIF'",
      options: [
        { value: 'AKTIF', label: resolveLabel({ tr: 'Aktif', en: 'Active' }), position: 0, color: 'green' },
        { value: 'BEKLEMEDE', label: resolveLabel({ tr: 'Beklemede', en: 'On Hold' }), position: 1, color: 'yellow' },
        { value: 'SONUCLANDI', label: resolveLabel({ tr: 'Sonuçlandı', en: 'Closed' }), position: 2, color: 'blue' },
        { value: 'IPTAL', label: resolveLabel({ tr: 'İptal', en: 'Cancelled' }), position: 3, color: 'gray' },
      ],
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.category,
      name: 'category',
      type: FieldType.SELECT as const,
      label: resolveLabel({ tr: 'Kategori', en: 'Category' }),
      icon: 'IconCategory',
      options: [...PROPERTY_SELECT_OPTIONS.category],
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.listingType,
      name: 'listingType',
      type: FieldType.SELECT as const,
      label: resolveLabel({ tr: 'İlan Tipi', en: 'Listing Type' }),
      icon: 'IconTag',
      options: [...PROPERTY_SELECT_OPTIONS.listingType],
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.budgetMax,
      name: 'budgetMax',
      type: FieldType.CURRENCY as const,
      label: resolveLabel({ tr: 'Bütçe (Üst)', en: 'Budget Max' }),
      icon: 'IconCurrencyLira',
      defaultValue: { amountMicros: null, currencyCode: "'TRY'" },
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.budgetMin,
      name: 'budgetMin',
      type: FieldType.CURRENCY as const,
      label: resolveLabel({ tr: 'Bütçe (Alt)', en: 'Budget Min' }),
      icon: 'IconCurrencyLira',
      defaultValue: { amountMicros: null, currencyCode: "'TRY'" },
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.districts,
      name: 'districts',
      type: FieldType.TEXT as const,
      label: resolveLabel({ tr: 'İlçeler', en: 'Districts' }),
      description: resolveLabel({
        tr: 'Virgülle ayrılmış; boşsa il geneli',
        en: 'Comma-separated; empty means anywhere',
      }),
      icon: 'IconMapPin',
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.rooms,
      name: 'rooms',
      type: FieldType.MULTI_SELECT as const,
      label: resolveLabel({ tr: 'Oda Planları', en: 'Room Plans' }),
      icon: 'IconDoor',
      options: [...PROPERTY_SELECT_OPTIONS.rooms],
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.excludedFeatures,
      name: 'excludedFeatures',
      type: FieldType.MULTI_SELECT as const,
      label: resolveLabel({ tr: 'İstenmeyen Özellikler', en: 'Deal-breakers' }),
      icon: 'IconBan',
      options: [...AMENITY_UNION_OPTIONS],
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.features,
      name: 'features',
      type: FieldType.MULTI_SELECT as const,
      label: resolveLabel({ tr: 'İstenen Özellikler', en: 'Wanted Features' }),
      icon: 'IconSparkles',
      options: [...AMENITY_UNION_OPTIONS],
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.sqmNetMin,
      name: 'sqmNetMin',
      type: FieldType.NUMBER as const,
      label: resolveLabel({ tr: 'Asgari Net m²', en: 'Min Net m²' }),
      icon: 'IconRuler',
      universalSettings: { dataType: NumberDataType.INT },
    },
    {
      universalIdentifier: BUYER_REQUEST_FIELD_IDS.notes,
      name: 'notes',
      type: FieldType.TEXT as const,
      label: resolveLabel({ tr: 'Notlar', en: 'Notes' }),
      description: resolveLabel({
        tr: 'Serbest metin; ileride AI eşleştirme bunu okuyacak',
        en: 'Free text; the future AI layer reads this',
      }),
      icon: 'IconNotes',
      isSearchable: true,
    },
  ],
});
