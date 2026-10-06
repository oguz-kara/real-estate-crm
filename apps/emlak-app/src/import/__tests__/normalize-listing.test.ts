import { describe, expect, test } from 'vitest';

import { normalizeListing } from 'src/import/normalize-listing';
import { type RawListing } from 'src/import/raw-listing.type';

const SAMPLE: RawListing = {
  'İlan no': '28359b55d339ee872507609eac929e15',
  Başlık: 'Bornova Erzene satılık 3+1',
  Açıklama: 'Geniş ve ferah daire',
  Kategoriler: 'Emlak, Konut, Satılık, Daire',
  Fiyat: '8.500.000 TL',
  Adres: 'İzmir / Bornova / Erzene Mah.',
  Konum: '38.468, 27.224',
  Özellikler: {
    'm² (Brüt)': '135',
    'm² (Net)': '110',
    'Oda Sayısı': '3+1',
    'Bulunduğu Kat': 'Yüksek Giriş',
    'Kat Sayısı': '0',
    'Bina Yaşı': '6-10 arası',
    Isıtma: 'Kombi (Doğalgaz)',
    'Banyo Sayısı': '2',
    Balkon: 'Var',
    Eşyalı: 'false',
    Asansör: 'Evet',
    'Deniz Manzarası': null,
    'Gizemli Özellik': 'Evet',
  },
  'Aktif Görsel Listesi': ['a1.jpg', 'b2.jpg'],
  'Video Listesi': [],
};

describe('normalizeListing', () => {
  test('maps a full konut listing into a REST-ready record', () => {
    const { record, issues } = normalizeListing(SAMPLE);

    expect(record.externalId).toBe('28359b55d339ee872507609eac929e15');
    expect(record.externalSource).toBe('SAHIBINDEN');
    expect(record.name).toBe('Bornova Erzene satılık 3+1');
    expect(record.description).toBe('Geniş ve ferah daire');
    expect(record.category).toBe('KONUT');
    expect(record.subType).toBe('DAIRE');
    expect(record.listingType).toBe('SATILIK');
    expect(record.price).toEqual({
      amountMicros: 8_500_000_000_000,
      currencyCode: 'TRY',
    });
    expect(record.city).toBe('İzmir');
    expect(record.district).toBe('Bornova');
    expect(record.neighborhood).toBe('Erzene Mah.');
    expect(record.latitude).toBe(38.468);
    expect(record.longitude).toBe(27.224);
    expect(record.sqmGross).toBe(135);
    expect(record.sqmNet).toBe(110);
    expect(record.rooms).toBe('R3_1');
    expect(record.floorLocation).toBe('YUKSEK_GIRIS');
    expect(record.totalFloors).toBe(0);
    // raw range preserved as a select value, never averaged to a number
    expect(record.buildingAge).toBe('AGE_6_10');
    expect(record.heating).toBe('KOMBI_DOGALGAZ');
    expect(record.bathroomCount).toBe(2);
    expect(record.balcony).toBe(true);
    expect(record.furnished).toBe(false);
    expect(record.exteriorFeatures).toEqual(['ASANSOR']);
    expect(record.imageFiles).toEqual(['a1.jpg', 'b2.jpg']);
    expect(record.videoFiles).toEqual([]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      externalId: '28359b55d339ee872507609eac929e15',
      field: 'Gizemli Özellik',
      reason: 'UNMAPPED_KEY',
    });
    expect(record.importNotes).toEqual({
      unmapped: [{ field: 'Gizemli Özellik', raw: 'Evet', reason: 'UNMAPPED_KEY' }],
    });
  });

  test('broken price and unknown heating produce issues, not a crash', () => {
    const { record, issues } = normalizeListing({
      ...SAMPLE,
      Fiyat: 'TL',
      Özellikler: { Isıtma: 'Füzyon Reaktörü' },
    });

    expect(record.price).toBeUndefined();
    expect(record.heating).toBeUndefined();
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      field: 'Isıtma',
      raw: 'Füzyon Reaktörü',
      reason: 'UNMAPPED_VALUE',
    });
  });

  test('clean listing carries no importNotes', () => {
    const { record, issues } = normalizeListing({
      ...SAMPLE,
      Özellikler: { Asansör: 'Evet' },
    });
    expect(issues).toEqual([]);
    expect(record.importNotes).toBeUndefined();
  });
});
