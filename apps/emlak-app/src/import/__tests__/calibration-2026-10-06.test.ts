import { describe, expect, test } from 'vitest';

import { mapCategories } from 'src/import/map-categories';
import { mapFeatures } from 'src/import/map-features';
import { parseBoolean } from 'src/import/parse-boolean';
import { applyStructuralFeatures } from 'src/import/structural-feature-keys';

// Pins the mappings surfaced by the first dry-run of the real export
// (import-report 2026-10-06: 41 listings, 145 unmapped keys).
describe('calibration against the real sahibinden export', () => {
  test('İş Yeri and Ticari category spellings map', () => {
    const result = mapCategories('Emlak, İş Yeri, Satılık, Ticari');
    expect(result.category).toBe('ISYERI');
    expect(result.listingType).toBe('SATILIK');
    expect(result.subType).toBe('TICARI');
    expect(result.issues).toEqual([]);
  });

  test('numeric Bina Yaşı buckets into the range select and keeps the exact year', () => {
    const result = applyStructuralFeatures({ 'Bina Yaşı': '8' });
    expect(result.fields.buildingAge).toBe('AGE_6_10');
    expect(result.fields.buildingAgeYears).toBe(8);
    expect(result.issues).toEqual([]);

    expect(applyStructuralFeatures({ 'Bina Yaşı': '31' }).fields.buildingAge).toBe('AGE_31_PLUS');
    expect(applyStructuralFeatures({ 'Bina Yaşı': '3' }).fields).toEqual({
      buildingAge: 'AGE_3',
      buildingAgeYears: 3,
    });
    // range strings still work (older exports)
    expect(applyStructuralFeatures({ 'Bina Yaşı': '6-10 arası' }).fields.buildingAge).toBe('AGE_6_10');
  });

  test('bare m² and m² Fiyatı map to sqmGross and pricePerSqm', () => {
    const result = applyStructuralFeatures({ 'm²': '9779', 'm² Fiyatı': '14910' });
    expect(result.fields.sqmGross).toBe(9779);
    expect(result.fields.pricePerSqm).toEqual({
      amountMicros: 14_910_000_000,
      currencyCode: 'TRY',
    });
  });

  test('Mutfak maps to the kitchenType select', () => {
    expect(applyStructuralFeatures({ Mutfak: 'Açık (Amerikan)' }).fields.kitchenType).toBe('ACIK_AMERIKAN');
    expect(applyStructuralFeatures({ Mutfak: 'Kapalı' }).fields.kitchenType).toBe('KAPALI');
  });

  test('Krediye Uygunluk with padded and Bilinmiyor values', () => {
    expect(applyStructuralFeatures({ 'Krediye Uygunluk': 'Evet ' }).fields.creditEligible).toBe('UYGUN');
    expect(applyStructuralFeatures({ 'Krediye Uygunluk': 'Bilinmiyor' }).fields.creditEligible).toBe('BILINMIYOR');
  });

  test('new structural fields: Taşınmaz Numarası, Depozito (TL), alan metrekareleri, Yatak ve Bölüm sayıları', () => {
    const result = applyStructuralFeatures({
      'Taşınmaz Numarası': '97093042',
      'Depozito (TL)': '35000',
      'Açık Alan m²': '724',
      'Kapalı Alan (m2)': '570',
      'Bölüm & Oda Sayısı': '2',
      'Yatak Sayısı': '20',
      'Yapının Durumu': 'İkinci El',
    });
    expect(result.fields.immovableNumber).toBe('97093042');
    expect(result.fields.deposit).toEqual({ amountMicros: 35_000_000_000, currencyCode: 'TRY' });
    expect(result.fields.openAreaSqm).toBe(724);
    expect(result.fields.closedAreaSqm).toBe(570);
    expect(result.fields.sectionRoomCount).toBe(2);
    expect(result.fields.bedCount).toBe(20);
    expect(result.fields.buildingCondition).toBe('IKINCI_EL');
    expect(result.issues).toEqual([]);
  });

  test('Türü fills subType, duplicates of other fields are discarded silently', () => {
    const result = applyStructuralFeatures({
      Türü: 'Dükkan & Mağaza',
      Durumu: 'Satılık',
      Kategori: 'İş Yeri',
      Depozito: 'Hayır',
    });
    expect(result.fields.subType).toBe('DUKKAN_MAGAZA');
    expect(result.fields).not.toHaveProperty('listingType');
    expect(result.issues).toEqual([]);
  });

  test('facade directions land in the facade multi-select', () => {
    const result = mapFeatures({ Doğu: 'Evet', Kuzey: 'Evet' });
    expect(result.fields.facade).toEqual(['DOGU', 'KUZEY']);
  });

  test('amenities accept Var, padded keys and spelling variants', () => {
    const result = mapFeatures({
      'Zemin Etüdü': 'Var',
      'Wi-Fi ': 'Evet',
      'Wi-Fİ': 'Evet',
    });
    expect(result.fields.infrastructure).toEqual(['ZEMIN_ETUDU']);
    expect(result.fields.interiorFeatures).toEqual(['WIFI']);
    expect(result.issues).toEqual([]);
  });

  test('business and facility amenities map to businessFeatures', () => {
    const result = mapFeatures({ 'Oda Servisi': 'Evet', 'Çay Ocağı': 'Evet' });
    expect(result.fields.businessFeatures).toEqual(['ODA_SERVISI', 'CAY_OCAGI']);
  });

  test('parseBoolean trims padded values', () => {
    expect(parseBoolean('Evet ')).toBe(true);
    expect(parseBoolean(' Yok')).toBe(false);
  });
});

describe('işyeri Mutfak flag and hotel Standart room', () => {
  test('Mutfak: Evet lands in businessFeatures, not kitchenType', () => {
    const result = applyStructuralFeatures({ Mutfak: 'Evet' });
    expect(result.fields.businessFeatures).toEqual(['MUTFAK']);
    expect(result.fields).not.toHaveProperty('kitchenType');
    expect(result.issues).toEqual([]);
  });

  test('Standart maps as a facility amenity', () => {
    expect(mapFeatures({ Standart: 'Evet' }).fields.businessFeatures).toEqual([
      'STANDART_ODA',
    ]);
  });
});
