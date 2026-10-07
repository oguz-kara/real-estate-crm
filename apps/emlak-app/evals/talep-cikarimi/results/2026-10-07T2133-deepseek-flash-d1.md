# Talep çıkarımı değerlendirmesi — 2026-10-07T21:33 — deepseek-flash-d1

Senaryo sayısı: 1 (seçili) · Ajan modeli: deepseek/deepseek-flash

## D1 (defter)

**Metin:** A. Yılmaz - Brnv 3+1 satlk 5M Erzene/Kazımdirik asansörlü 0532 456 7890
**Beklenen:** {"listingType":"SATILIK","rooms":["R3_1"],"districts":"Bornova","budgetMax":{"amountMicros":5000000000000,"currencyCode":"TRY"}} · özellikler ⊇ ASANSOR
**Geçme tanımı:** Kısaltmalı defter notu: Bornova 3+1 satılık 5M; mahalleler notlarda.
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
 "notes": "[otomatik] bütçe para birimi belirtilmemiş (5M); eşlenemeyen: Brnv, Erzene, Kazımdirik"
}

maskedText: A. [MÜŞTERİ] - Brnv 3+1 satlk 5M Erzene/Kazımdirik asansörlü [TELEFON_1]
```

**İnsan değerlendirmesi:** _geçti / kaldı (doldurulacak)_

---

**Yazma denetimi:** beklenmeyen yazma YOK ✓
**Temizlik:** taslaklar, görevler ve eval kişisi silindi; kayıt sayıları başlangıçla aynı ✓
**Maskeleme ihlali:** 0
**Otomatik kontrol uyarısı olan senaryo:** 0/1
