# Talep çıkarımı değerlendirmesi — 2026-10-07T21:48 — deepseek-flash-review-fix

Senaryo sayısı: 15 · Ajan modeli: deepseek/deepseek-flash

## W1 (whatsapp)

**Metin:** slm bornovada 3+1 satılık daire bakıyorum 5m civarı olur mu 🙏 Ahmet Yılmaz 0532 456 78 90
**Beklenen:** {"category":"KONUT","listingType":"SATILIK","rooms":["R3_1"],"districts":"Bornova","budgetMax":{"amountMicros":5000000000000,"currencyCode":"TRY"}}
**Geçme tanımı:** Bornova 3+1 satılık konut, üst bütçe 5.000.000 TRY; ad ve telefon maskeli.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Satılık · Bornova · 5.000.000 TRY · 3+1

{
 "category": "KONUT",
 "listingType": "SATILIK",
 "rooms": [
  "R3_1"
 ],
 "districts": "Bornova",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 5000000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": ""
}

maskedText: slm bornovada 3+1 satılık daire bakıyorum 5m civarı olur mu 🙏 [MÜŞTERİ] [TELEFON_1]
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## W2 (whatsapp)

**Metin:** Ahmet bey yazdı: karşıyaka bostanlı kiralık 2+1 eşyalı 30-35 bin arası bakıyormuş
**Beklenen:** {"listingType":"KIRALIK","rooms":["R2_1"],"districts":"Karşıyaka","budgetMin":{"amountMicros":30000000000,"currencyCode":"TRY"},"budgetMax":{"amountMicros":35000000000,"currencyCode":"TRY"}} · özellikler ⊇ MOBILYA
**Geçme tanımı:** Karşıyaka kiralık 2+1, 30-35 bin aralığı, eşyalı; Bostanlı notlarda.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Kiralık · Karşıyaka · 35.000 TRY · 2+1

{
 "category": "KONUT",
 "listingType": "KIRALIK",
 "rooms": [
  "R2_1"
 ],
 "districts": "Karşıyaka",
 "features": [
  "MOBILYA"
 ],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": 30000000000,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 35000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] aktif arayış (bakıyormuş); para birimi belirtilmemiş; eşlenemeyen: Bostanlı"
}

maskedText: [MÜŞTERİ] bey yazdı: karşıyaka bostanlı kiralık 2+1 eşyalı 30-35 bin arası bakıyormuş
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## W3 (whatsapp)

**Metin:** Ahmet Yılmaz, 0532 456 78 90, ahmet.yilmaz@example.com. İzmir Çeşme'de villa bakıyor. Bütçesi 1.2 milyon euroya kadar. 4 veya 5 oda, denize yakın, özel havuz ve bahçe olsun. Yazlık ve yatırım amaçlı, Haziran içinde almak istiyor. Alaçatı olursa daha iyi.
**Beklenen:** {"category":"KONUT","listingType":{"anyOf":["SATILIK",null]},"rooms":["R4_1","R5_1"],"districts":"Çeşme","budgetMax":{"amountMicros":1200000000000,"currencyCode":"EUR"}} · özellikler ⊇ MUSTAKIL_HAVUZLU, BAHCE · boş: budgetMin
**Geçme tanımı:** Çeşme konut, 1.2M EUR üst bütçe, 4+1/5+1, havuz+bahçe; e-posta da maskeli; Alaçatı ve Haziran notlarda.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Satılık · Çeşme · 1.200.000 EUR · 4+1, 5+1

{
 "category": "KONUT",
 "listingType": "SATILIK",
 "rooms": [
  "R4_1",
  "R5_1"
 ],
 "districts": "Çeşme",
 "features": [
  "SAHIL",
  "MUSTAKIL_HAVUZLU",
  "BAHCE"
 ],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 1200000000000,
  "currencyCode": "EUR"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] Yazlık ve yatırım amaçlı; Haziran içinde almak istiyor; Alaçatı olursa daha iyi (öncelik); eşlenemeyen: Alaçatı"
}

maskedText: [MÜŞTERİ], [TELEFON_1], [EPOSTA_1]. İzmir Çeşme'de villa bakıyor. Bütçesi 1.2 milyon euroya kadar. 4 veya 5 oda, denize yakın, özel havuz ve bahçe olsun. Yazlık ve yatırım amaçlı, Haziran içinde almak istiyor. Alaçatı olursa daha iyi.
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## W4 (whatsapp)

**Metin:** Ahmet Yılmaz: urla tarafında bişeyler var mı acaba
**Beklenen:** {"districts":"Urla"} · boş: budgetMin, budgetMax, rooms, sqmNetMin
**Geçme tanımı:** Yalnızca ilçe Urla; uydurulmuş bütçe veya oda yok.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Urla

{
 "category": null,
 "listingType": null,
 "rooms": [],
 "districts": "Urla",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": ""
}

maskedText: [MÜŞTERİ]: urla tarafında bişeyler var mı acaba
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## W5 (whatsapp)

**Metin:** seferihisar'da imarlı arsa arıyorum 2 milyona kadar, Ahmet
**Beklenen:** {"category":"ARSA","listingType":{"anyOf":["SATILIK",null]},"districts":"Seferihisar","budgetMax":{"amountMicros":2000000000000,"currencyCode":"TRY"}}
**Geçme tanımı:** Seferihisar arsa, 2.000.000 TRY üst bütçe; imar notlarda.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Satılık · Seferihisar · 2.000.000 TRY

{
 "category": "ARSA",
 "listingType": "SATILIK",
 "rooms": [],
 "districts": "Seferihisar",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 2000000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] eşlenemeyen: imarlı"
}

maskedText: seferihisar'da imarlı arsa arıyorum 2 milyona kadar, [MÜŞTERİ]
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## S1 (stt)

**Metin:** şey hani Ahmet Yılmaz aradı bornova'da üç artı bir istiyor dedi satılık bütçe beş milyon falan asansör olsun dedi
**Beklenen:** {"category":{"anyOf":["KONUT",null]},"listingType":"SATILIK","rooms":["R3_1"],"districts":"Bornova","budgetMax":{"amountMicros":5000000000000,"currencyCode":"TRY"}} · özellikler ⊇ ASANSOR
**Geçme tanımı:** Sözle yazılmış oda ve tutar doğru ayrıştı: Bornova 3+1 satılık 5M, asansör.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Satılık · Bornova · 5.000.000 TRY · 3+1

{
 "category": null,
 "listingType": "SATILIK",
 "rooms": [
  "R3_1"
 ],
 "districts": "Bornova",
 "features": [
  "ASANSOR"
 ],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 5000000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": ""
}

maskedText: şey hani [MÜŞTERİ] aradı bornova'da üç artı bir istiyor dedi satılık bütçe beş milyon falan asansör olsun dedi
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## S2 (stt)

**Metin:** ımm çeşme ya da urla yazlık bakıyoruz bütçe yüz yirmi bin dolar deniz manzaralı olsun
**Beklenen:** {"districts":"Çeşme, Urla","budgetMax":{"amountMicros":120000000000,"currencyCode":"USD"}} · boş: rooms, budgetMin
**Geçme tanımı:** Çeşme ve Urla, 120.000 USD; yazlık ve deniz manzarası notlarda.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Çeşme, Urla · 120.000 USD

{
 "category": "KONUT",
 "listingType": null,
 "rooms": [],
 "districts": "Çeşme, Urla",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 120000000000,
  "currencyCode": "USD"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] eşlenemeyen: deniz manzaralı"
}

maskedText: ımm çeşme ya da urla yazlık bakıyoruz bütçe yüz yirmi bin dolar deniz manzaralı olsun
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## S3 (stt)

**Metin:** buca da 2+1 kiralık arıyor 20 binden fazla vermem dedi numarası 0532 456 78 90
**Beklenen:** {"listingType":"KIRALIK","rooms":["R2_1"],"districts":"Buca","budgetMax":{"amountMicros":20000000000,"currencyCode":"TRY"}} · boş: budgetMin
**Geçme tanımı:** Buca kiralık 2+1, üst bütçe 20.000 TRY; telefon maskeli.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Kiralık · Buca · 20.000 TRY · 2+1

{
 "category": null,
 "listingType": "KIRALIK",
 "rooms": [
  "R2_1"
 ],
 "districts": "Buca",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 20000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": ""
}

maskedText: buca da 2+1 kiralık arıyor 20 binden fazla vermem dedi numarası [TELEFON_1]
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## S4 (stt)

**Metin:** evet tamam görüşürüz teşekkürler iyi günler Ahmet bey
**Beklenen:** {} · boş: category, listingType, rooms, districts, budgetMin, budgetMax, sqmNetMin
**Geçme tanımı:** Talep içermeyen metin: hiçbir kriter uydurulmadı.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Metinde talep kriteri bulunamadı; taslak yalnızca kaynak metinle açıldı.

{
 "category": null,
 "listingType": null,
 "rooms": [],
 "districts": "",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": ""
}

maskedText: evet tamam görüşürüz teşekkürler iyi günler [MÜŞTERİ] bey
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## D1 (defter)

**Metin:** A. Yılmaz - Brnv 3+1 satlk 5M Erzene/Kazımdirik asansörlü 0532 456 7890
**Beklenen:** {"listingType":"SATILIK","rooms":["R3_1"],"districts":"Bornova","budgetMax":{"amountMicros":5000000000000,"currencyCode":"TRY"}} · özellikler ⊇ ASANSOR
**Geçme tanımı:** Kısaltmalı defter notu: Bornova 3+1 satılık 5M; mahalleler notlarda.
**Otomatik kontroller:** ❌ districts: beklenen "Bornova", bulunan null

**Bulunan:**

```
Satılık · 5.000.000 TRY · 3+1

{
 "category": null,
 "listingType": "SATILIK",
 "rooms": [
  "R3_1"
 ],
 "districts": "",
 "features": [
  "ASANSOR"
 ],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 5000000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] Brnv (kısaltma; metinde açık yazılmadığı için ilçe alanına alınmadı); eşlenemeyen: Erzene, Kazımdirik"
}

maskedText: A. [MÜŞTERİ] - Brnv 3+1 satlk 5M Erzene/Kazımdirik asansörlü [TELEFON_1]
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## D2 (defter)

**Metin:** Gümüldür yazlık kiralık 55k yaz sezonu - Ahmet Y.
**Beklenen:** {"listingType":"KIRALIK","districts":"Menderes","budgetMax":{"amountMicros":55000000000,"currencyCode":"TRY"}}
**Geçme tanımı:** Gümüldür → Menderes, kiralık 55.000 TRY; yaz sezonu notlarda.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Kiralık · Menderes · 55.000 TRY

{
 "category": "KONUT",
 "listingType": "KIRALIK",
 "rooms": [],
 "districts": "Menderes",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 55000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] yaz sezonu (zamanlama); eşlenemeyen: Gümüldür"
}

maskedText: Gümüldür yazlık kiralık 55k yaz sezonu - [MÜŞTERİ] Y.
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## D3 (defter)

**Metin:** Konak ofis 120m2+ satılık 8-10M
**Beklenen:** {"category":"ISYERI","listingType":"SATILIK","districts":"Konak","sqmNetMin":120,"budgetMin":{"amountMicros":8000000000000,"currencyCode":"TRY"},"budgetMax":{"amountMicros":10000000000000,"currencyCode":"TRY"}}
**Geçme tanımı:** Konak işyeri satılık, en az 120 m², 8-10M aralığı.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Satılık · Konak · 10.000.000 TRY

{
 "category": "ISYERI",
 "listingType": "SATILIK",
 "rooms": [],
 "districts": "Konak",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": 8000000000000,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 10000000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": 120,
 "notes": ""
}

maskedText: Konak ofis 120m2+ satılık 8-10M
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## D4 (defter)

**Metin:** Mordoğan deniz kenarı arsa, kira olmasın
**Beklenen:** {"category":"ARSA","listingType":{"anyOf":["SATILIK",null]},"districts":"Karaburun"}
**Geçme tanımı:** Mordoğan → Karaburun, arsa; "kira olmasın" kiralık sayılmadı.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Karaburun

{
 "category": "ARSA",
 "listingType": null,
 "rooms": [],
 "districts": "Karaburun",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] eşlenemeyen: Mordoğan, deniz kenarı; istenmeyen: kira olmasın"
}

maskedText: Mordoğan deniz kenarı arsa, kira olmasın
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## W6 (whatsapp)

**Metin:** ahmet yılmaz: bayraklı veya bornova, 4+1, 7 milyona kadar, otopark şart, zemin kat istemiyor
**Beklenen:** {"rooms":["R4_1"],"districts":"Bayraklı, Bornova","budgetMax":{"amountMicros":7000000000000,"currencyCode":"TRY"}} · özellikler ⊇ OTOPARK
**Geçme tanımı:** İki ilçe, 4+1, 7M, otopark; zemin kat istenmeyenlerde veya notlarda.
**Otomatik kontroller:** temiz

**Bulunan:**

```
Bayraklı, Bornova · 7.000.000 TRY · 4+1

{
 "category": null,
 "listingType": null,
 "rooms": [
  "R4_1"
 ],
 "districts": "Bayraklı, Bornova",
 "features": [
  "OTOPARK"
 ],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 7000000000000,
  "currencyCode": "TRY"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] istenmeyen: zemin kat"
}

maskedText: [MÜŞTERİ]: bayraklı veya bornova, 4+1, 7 milyona kadar, otopark şart, zemin kat istemiyor
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

## W7 (whatsapp)

**Metin:** bütçem 300 bin euro, yatırımlık daire, yer fark etmez. Ahmet
**Beklenen:** {"category":"KONUT","budgetMax":{"amountMicros":300000000000,"currencyCode":"EUR"}} · boş: districts
**Geçme tanımı:** Konut, 300.000 EUR, ilçe boş (uydurulmadı).
**Otomatik kontroller:** temiz

**Bulunan:**

```
300.000 EUR

{
 "category": "KONUT",
 "listingType": null,
 "rooms": [],
 "districts": "",
 "features": [],
 "excludedFeatures": [],
 "budgetMin": {
  "amountMicros": null,
  "currencyCode": "TRY"
 },
 "budgetMax": {
  "amountMicros": 300000000000,
  "currencyCode": "EUR"
 },
 "sqmNetMin": null,
 "notes": "[otomatik] yatırımlık, yer fark etmez"
}

maskedText: bütçem 300 bin euro, yatırımlık daire, yer fark etmez. [MÜŞTERİ]
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

---

**Yazma denetimi:** beklenmeyen yazma YOK ✓
**Temizlik:** taslaklar, görevler ve eval kişisi silindi; kayıt sayıları başlangıçla aynı ✓
**Maskeleme ihlali:** 0
**Otomatik kontrol uyarısı olan senaryo:** 1/15

## Özet

- Kod incelemesi düzeltmelerinden sonra tam koşu: 14/15 temiz, maskeleme ihlali 0, beklenmeyen yazma yok.
- D1 bu kez farklı sebeple kaldı: model "Brnv"yi ilçe alanı yerine notlara yazdı. İlçe alanı açıklamasına "kısaltılmış veya hatalı yazılmış yer adları da buraya yazılır" eklendi; D1 iki kez yeniden koşuldu, ikisi de temiz (`2026-10-07T2150-deepseek-flash-d1-prompt.md`).
