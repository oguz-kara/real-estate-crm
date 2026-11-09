# Spec: İki dilli arayüz — metadata etiketi çevirisi (özellik 7 v2)

**Tarih:** 2026-10-06 · **Durum:** Onaylı (owner: "onaylıyorum spec'i yaz ve devam et")

## Problem

Kullanıcı dili `tr-TR` yapıldığında Twenty'nin arayüz iskeleti Türkçeleşiyor, ancak:

1. **Çekirdek metadata etiketleri İngilizce kalıyor** (sidebar: Companies/People/Tasks/Notes;
   kolon başlıkları: Emails/Phones/Creation date...). Sunucuda tam çeviri kataloğu ve
   `x-locale` tabanlı çeviri hattı var (`translateStandardLabel`, "Tasks→Görevler" po'da
   mevcut) ama canlı testte etiketler her iki locale'de de İngilizce dönüyor — hat kopuk.
2. **Emlak app etiketleri dile duyarsız:** apply anında tek dilde (şu an Türkçe) basılıyor;
   İngilizce kullanıcı da Türkçe görüyor.
3. Ön yüz kataloğunda (~4.508 girdi) yalnızca 145 boş msgstr var; görünür eksikler
   katalog eksiği değil, 1-2'nin sonucu.

## Kısıtlar

- Kod/DB kimlikleri (API adları, tablo, değişken) İngilizce kalır; yalnızca görünen katman değişir.
- Çekirdek nesnelerin kaynak etiketleri yeniden adlandırılmaz (owner kararı) — çeviri,
  locale bazlı sunum katmanında olmalı.
- Fork, upstream twenty/v2.44.0 üstünde; çekirdek değişikliği minimum ve merge-dostu olmalı.
- Çeviri kataloğu commit yasağı bu iş için geçerli değil (CLAUDE.md: "unless translations are the task").

## Hedef davranış

| Kullanıcı dili | Çekirdek etiketler | Emlak etiketleri | UI iskeleti |
|---|---|---|---|
| tr-TR | Görevler, Şirketler, Oluşturulma tarihi... (po'dan) | Portföyler, Talepler... | Türkçe |
| en | Tasks, Companies, Creation date... | Properties, Requests... | İngilizce |

## Yaklaşım

1. **Kök neden:** Standart etiket çeviri hattının bu ortamda neden no-op olduğunu bul
   (şüpheliler: `request.locale` aktarımı, standart app id çözümü dev-seed workspace'te,
   katalog msgid/context uyumsuzluğu, metadata cache'in locale'siz anahtarlanması,
   front'un kullandığı uç). Düzelt veya eksik konfigürasyonu tamamla.
2. **Emlak app kataloğu:** Resmî SDK mekanizması (`manifest.translations` +
   `locales/tr-TR.json`): kaynak etiketler İngilizce'ye çevrilir (SOURCE_LOCALE=en),
   Türkçe katalog mevcut `{tr, en}` çiftlerinden üretilir; `options`/select etiketleri dahil.
3. **Kırıntılar:** 1-2 sonrası hâlâ görünür İngilizce kalan az sayıda string için
   `packages/twenty-front/src/locales/tr-TR.po` doldurulur + lingui compile.
4. **Doğrulama:** tr ve en kullanıcıyla Playwright ekran turu; MCP/REST'te etiketlerin
   locale'e göre döndüğünün kanıtı.

## Kapsam dışı

- EN demo workspace kurulumu (backlog'da ayrı iş).
- Kayıt VERİSİ çevirisi (ilan başlıkları vb. veridir, çevrilmez).
- Çekirdek nesnelerin workspace-bazlı yeniden adlandırılması.
