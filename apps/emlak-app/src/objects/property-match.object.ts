import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { metadataLabel, trLabel } from 'src/constants/app-locale';
import { PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';
import {
  BUYER_REQUEST_FIELD_IDS,
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  PROPERTY_MATCH_FIELD_IDS,
  PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  PROPERTY_MATCHES_FIELD_ID,
} from 'src/constants/request-field-ids';

export { PROPERTY_MATCH_UNIVERSAL_IDENTIFIER };

export default defineObject({
  universalIdentifier: PROPERTY_MATCH_UNIVERSAL_IDENTIFIER,
  nameSingular: 'propertyMatch',
  namePlural: 'propertyMatches',
  labelSingular: metadataLabel({ tr: 'Eşleşme', en: 'Match' }),
  labelPlural: metadataLabel({ tr: 'Eşleşmeler', en: 'Matches' }),
  description: metadataLabel({
    tr: 'Talep ile portföy arasındaki skorlu, durumlu eşleşme kaydı',
    en: 'Scored, stateful match between a buyer request and a property',
  }),
  icon: 'IconArrowsLeftRight',
  fields: [
    {
      universalIdentifier: PROPERTY_MATCH_FIELD_IDS.score,
      name: 'score',
      type: FieldType.NUMBER as const,
      label: metadataLabel({ tr: 'Skor', en: 'Score' }),
      icon: 'IconPercentage',
      universalSettings: { dataType: NumberDataType.INT },
    },
    {
      universalIdentifier: PROPERTY_MATCH_FIELD_IDS.status,
      name: 'status',
      type: FieldType.SELECT as const,
      label: metadataLabel({ tr: 'Durum', en: 'Status' }),
      icon: 'IconProgressCheck',
      defaultValue: "'YENI'",
      options: [
        { value: 'YENI', label: trLabel({ tr: 'Yeni', en: 'New' }), position: 0, color: 'green' },
        { value: 'GOSTERILDI', label: trLabel({ tr: 'Gösterildi', en: 'Shown' }), position: 1, color: 'blue' },
        { value: 'BEGENMEDI', label: trLabel({ tr: 'Beğenmedi', en: 'Rejected' }), position: 2, color: 'gray' },
        { value: 'YER_GOSTERILDI', label: trLabel({ tr: 'Yer Gösterildi', en: 'Toured' }), position: 3, color: 'purple' },
        { value: 'TEKLIF', label: trLabel({ tr: 'Teklif', en: 'Offer' }), position: 4, color: 'orange' },
      ],
    },
    {
      universalIdentifier: PROPERTY_MATCH_FIELD_IDS.request,
      name: 'request',
      type: FieldType.RELATION as const,
      label: metadataLabel({ tr: 'Talep', en: 'Request' }),
      icon: 'IconUserSearch',
      relationTargetObjectMetadataUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier: BUYER_REQUEST_FIELD_IDS.matches,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'requestId',
      },
    },
    {
      universalIdentifier: PROPERTY_MATCH_FIELD_IDS.property,
      name: 'property',
      type: FieldType.RELATION as const,
      label: metadataLabel({ tr: 'Portföy', en: 'Property' }),
      icon: 'IconBuildingCommunity',
      relationTargetObjectMetadataUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier: PROPERTY_MATCHES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'propertyId',
      },
    },
  ],
});
