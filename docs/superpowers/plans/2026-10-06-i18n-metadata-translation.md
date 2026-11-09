# Plan: İki dilli metadata etiketleri (özellik 7 v2)

Spec: `docs/superpowers/specs/2026-10-06-i18n-metadata-translation.md`
Kök neden raporu: ultracode workflow `wf_a72469a6-0bf` (güven: yüksek).

## Bulgular (uygulamayı şekillendiren)

- `request.locale` = `core.userWorkspace.locale` (x-locale başlığı girişli istekte asla
  devreye girmez; `workspaceMember.locale` ayrı bir tablo ve hat onu okumaz).
  Çeviri makinesi (msgid hash + derlenmiş kataloglar) sağlam.
- SDK app'leri için resmî mekanizma: `locales/tr-TR.json` → `yarn twenty apply` →
  `core.applicationTranslation` satırı → sunucu locale'e göre çevirir.
  Katalog ANAHTARI kaynak string'tir → manifest kaynakları İngilizce olmak zorunda
  (`en` kataloğu derlenmez, SOURCE_LOCALE atlanır).
- SELECT/MULTI_SELECT seçenek etiketleri hiçbir mekanizmayla çevrilemez → Türkçe kalır.
- Çeviri senkronu apply içinde non-fatal → her apply sonrası satır sayısı doğrulanır.

## Task A — Çekirdek etiketler (TAMAMLANDI)

`updateWorkspaceMemberSettings` mutasyonu (locale: tr-TR, /metadata ucu) userWorkspace'i
senkronlar + cache temizler. Doğrulandı: Görevler/Şirketler/Kişiler/Notlar,
E-postalar/Telefonlar/Oluşturulma tarihi/İş Unvanı sunucudan Türkçe dönüyor.
Kod değişikliği yok. Her yeni üyede dil Settings → Deneyim'den seçilir.

## Task B — Emlak app kataloğu

1. `app-locale.ts`: `metadataLabel(pair)` ekle — İngilizce kaynak döner (`en ?? tr`),
   döndürürken `{en→tr}` çiftini modül-düzeyi registry'ye yazar (katalog doldurma için).
   `resolveLabel` RUNTIME string'lerde kalır (görev başlıkları Türkçe, ofis dili);
   `trLabel` import eşlemelerinde kalır.
2. Manifest dosyalarında etiket çağrılarını değiştir:
   - objects (3) + fields (8) + views (7): `resolveLabel` → `metadataLabel`
     (label, description, view name).
   - `property-options.ts` / follow-up alan seçenekleri: option etiketleri → `trLabel`
     (çevrilemez sınırı; Türkçe sabitlenir, bilinçli).
3. `yarn twenty dev:translations-extract --locale tr-TR` → `locales/tr-TR.json` iskeleti.
4. `scripts/fill-tr-catalog.ts`: tüm src modüllerini import edip registry'yi doldurur,
   iskeletteki boş değerleri en→tr sözlüğünden tamamlar; eşleşmeyeni raporlar.
5. TEK apply ile kaynak değişimi + katalog gider (risk: ayrı apply'da tr kullanıcı
   kısa süre İngilizce görür). psql ile `applicationTranslation` satırı doğrulanır;
   sync hatası loglarda `Failed to sync application translations` aranır.
6. Doğrulama: REST metadata tim (tr) → Portföyler/Talepler + Görevler;
   tim geçici en → Properties/Requests + Tasks; geri tr. Playwright iki dilde ekran turu.
7. Test/typecheck/lint; HANDOFF; commit + push.

## Kapsam dışı / bilinçli bırakılan

- `bind-data-to-request-object` x-locale override fork yaması: YAPILMIYOR
  (upstream'in bilinçli tasarımı; merge yüzeyi açmaya değmez — veri düzeltmesi yeterli).
- Ön yüz tr-TR.po'daki 145 boş msgstr: görünür ekranlarda eksik çıkarsa doldurulur,
  proaktif doldurulmaz (çoğu kıyıda köşede).
- Seçenek etiketleri ve logic function açıklamaları Türkçe kalır.
