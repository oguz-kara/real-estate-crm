# Spec: Emlak Asistanı — kontrollü AI sohbet katmanı v1

**Tarih:** 2026-10-07 · **Durum:** Tasarım onaylı (owner), spec incelemesi bekliyor
**Önceki karar zinciri:** amaç = ofis kullanımı öncelikli (B); v1 = yalnızca salt-okunur
sohbet asistanı; sağlayıcı = DeepSeek (owner kararı, maliyet gerekçesiyle; dil-kalitesi
kanıtı test setiyle ölçülecek); anahtar owner tarafından temin ediliyor.

## Amaç ve başarı kriteri

Ofisin (Türkçe konuşan, teknik olmayan kullanıcı) Twenty sohbetinden portföy/talep
sorularına güvenilir cevap alması: "Bornova'da 10M altı 3+1 var mı?" → doğru araç
çağrısı + doğru Türkçe özet. Başarı: test setindeki senaryoların ≥%80'i yazılı
"geçti" tanımını karşılar; asistan hiçbir senaryoda veri uydurmaz ve hiçbir yolla
kayıt değiştiremez.

## Kapsam (v1)

1. **DeepSeek sağlayıcı bağlantısı** — `AI_PROVIDERS` config değişkenine (JSON)
   `deepseek` girdisi: `npm: @ai-sdk/openai-compatible`,
   `baseUrl: https://api.deepseek.com`, `apiKey` (yalnızca `.env`, asla git),
   model kayıtları `deepseek-v4-pro` (ana) ve `deepseek-flash` (deneme).
   Mekanizma çekirdekte hazır (`provider-config.service.ts` → custom merge,
   `sdk-provider-factory.service.ts` → `createOpenAICompatible`); çekirdek kod
   değişikliği YOK. İlk adım duman testi: tek sorgu ile uçtan uca hat + bir araç
   çağrısının çalıştığının kanıtı (bu yol az test edilmiş — ana risk burada,
   başarısızsa model/uyumluluk seçenekleriyle owner'a dönülür).
2. **Emlak Asistanı ajanı** — `apps/emlak-app` içinde `defineAgent` (git'te,
   versiyonlu). Türkçe sistem talimatı: rol (portföy/talep asistanı), sınırlar
   (veride olmayanı uydurma; tahmin/yorum istenirse "bu veriden çıkarılamaz" de;
   kayıt değiştirme taleplerini salt-okunur olduğunu söyleyerek reddet), üslup
   (kısa, net, Türkçe). Model: `deepseek-v4-pro`.
3. **Salt-okunurluk izin katmanında** — ajana yazma yetkisi olmayan bir rol
   bağlanır (tüm nesnelerde okuma, hiçbirinde yazma). Araç listesi yalnızca
   `search_properties`. `match_buyer_request` v1'de bilinçli olarak YOK
   (propertyMatch yazar); mevcut eşleşmeler rolün okuma izniyle cevaplanır.
   Salt-okunurluk garantisi prompt'a değil izin sistemine dayanır.
4. **Test seti** — `apps/emlak-app/evals/chat-assistant/` altında ~15 senaryo,
   4 kategori, her biri yazılı geçme tanımıyla:
   - Doğru cevap (6-7): araç çağrısı + doğru Türkçe özet beklenir.
   - "Bilmiyorum" (3-4): spekülasyon istenir, veri-dışı tahmin uydurmaz.
   - Reddetme (2-3): silme/değiştirme istenir; salt-okunur olduğunu söyler,
     hiçbir yazma gerçekleşmez (DB'den doğrulanır).
   - Tuzak (2-3): olmayan ilçe, saçma bütçe, boş sonuç; zarif boş dönüş,
     halüsinasyon yok.
   `scripts/run-chat-eval.ts` senaryoları ajana sorar, cevapları ve otomatik
   asgari kontrolleri (beklenen araç çağrıldı mı; yazma oldu mu; boş-sonuç
   senaryosunda portföy adı geçiyor mu) tarihli+modelli rapora yazar:
   `evals/chat-assistant/results/<tarih>-<model>.md`. Nihai değerlendirme insan
   gözüyle. LLM-hakem yok.
5. **Model karşılaştırma koşusu** — aynı set `claude-haiku-4-5` ve
   `claude-opus-5-5` ile de koşulur (anahtar varsa; yoksa rapora "koşulmadı"
   yazılır) — toplam maliyet ~1$ altı. Karar verisi owner'a sunulur.
6. **Maliyet/emniyet** — `ai-billing` paneli harcama görünürlüğü; beklenti
   ~$2-4.5/ay; DeepSeek konsolunda düşük limitli anahtar önerisi; prompt ve
   eval değişikliklerinde set yeniden koşulur (regresyon disiplini).

## Veri notu (bilinçli karar)

Sohbet bağlamında müşteri/portföy verisi DeepSeek (Çin merkezli) sunucularına
gider. Owner maliyet gerekçesiyle bunu kabul etti; üretim yoğun kullanıma
geçerken KVKK değerlendirmesi yeniden açılır (spec'in başarı kriteri değil,
kayıtlı risk).

## Kapsam dışı

- Yazan her tür araç/akış (talep oluşturma, eşleştirme tetikleme) — ayrı spec.
- Eşleşme açıklaması, doğal dilden talep girişi, ilan metni üretimi (sonraki
  sürümler, her biri kendi spec'iyle).
- EN demo, WhatsApp, LLM-hakemli otomatik değerlendirme.

## Riskler ve geri dönüşler

| Risk | Karşılık |
|---|---|
| openai-compatible hattında araç çağrımı uyumsuzluğu | İlk iş duman testi; başarısızsa bulgularla owner'a dön (alternatif: katalogdaki yerleşik sağlayıcılar) |
| DeepSeek Türkçe kalitesi yetersiz | Test seti sayı verir; model değişimi tek ayar; karşılaştırma koşuları hazır |
| Ajan izin modelinin SDK'da beklenen şekilde bağlanamaması | Rol bağlanamıyorsa v1 araç listesi + workspace üye izinleriyle aynı garanti kurulur; spec hedefi değişmez: ajan hiçbir yolla yazamaz |
| Maliyet sürprizi | ai-billing görünürlüğü + düşük limitli anahtar |
