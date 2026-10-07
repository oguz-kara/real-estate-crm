# Spec: Metinden Talep Girişi — serbest metinden taslak talep (v1)

**Tarih:** 2026-10-07 · **Durum:** Tasarım onaylı (owner), spec incelemesi bekliyor
**Önceki karar zinciri:** sıradaki LLM özelliği = talep girişi (eşleşme açıklaması
rakip araştırmasıyla elendi; kişi özeti ve önerilen mesaj sonraya); v1 = kullanıcının
açıkça verdiği herhangi bir serbest Türkçe metin (kaynak bağımsız: WhatsApp, telefon
transkripti, görüşme notu, defter); kişi = mevcut kaydı bağla (B), oluşturma kapsam
dışı; eksik alan politikası = esnek (A); kişisel veri LLM'e asla gitmez (maskeleme,
isim dahil); onay = veri durumu (TASLAK → AKTİF); giriş yüzeyi = Kişi kaydı üstünden
komut menüsü + yan panel formu (sohbet değil, çünkü sohbete yapıştırılan metin
sohbet LLM'inden geçer).

## Amaç ve başarı kriteri

Ofisin yapılandırılmamış lead kanalını (WhatsApp, telefon, not, defter) eşleştirme
motoruna bağlamak: bir Kişi kaydının üstünde serbest Türkçe metin yapıştırılır,
sistem o kişiye bağlı bir **taslak talep** çıkarır, insan onaylar, mevcut eşleştirme
döngüsü (anlık eşleşme, gece taraması, görevler) kendiliğinden devreye girer.

Rakiplerden farkımız: FUB/Lofty alıcı kriterini portal formundan hazır alır; biz
konuşmadan çıkarırız. Değer: bugün 0 talep var çünkü elle giriş yapılmıyor; talep
kaybolmasın.

Başarı:
- Çıkarım eval setinde (≈15 senaryo, 3 üslup) senaryoların ≥%80'i yazılı geçme
  tanımını karşılar; hiçbir senaryoda uydurulmuş alan yok (beklenen `null` iken dolu
  gelen alan = başarısız).
- Eval ve birim testlerde **maskeli prompt'ta telefon deseni, e-posta ve kişi adı
  bulunmaz** (otomatik iddia, istisnasız).
- Taslak talep hiçbir koşulda eşleştirmeye girmez; onayda AKTİF'e çevrilince
  mevcut anlık-eşleşme tetikleyicisi çalışır (uçtan uca Playwright ile gösterilir).
- Çıkarım başarısız olsa bile talep metni kaybolmaz (kaynak metinli TASLAK açılır).

## Kapsam (v1)

1. **Veri modeli (talep nesnesi `buyerRequest`)**
   - `status` SELECT'e yeni seçenek `TASLAK` (etiket tr "Taslak" / en "Draft", renk
     gri, position 4). Varsayılan `AKTIF` değişmez; taslak durumunu yalnızca çıkarım
     fonksiyonu yazar. Eşleştirme çekirdeği zaten `status !== 'AKTIF'` ise durduğu
     için (`run-request-matching.ts`) taslaklar motora girmez; eşleştirme kodu
     değişmez.
   - `kaynak` SELECT, opsiyonel: `WHATSAPP` (WhatsApp), `TELEFON` (Telefon),
     `YUZ_YUZE` (Yüz yüze), `DEFTER` (Defter), `DIGER` (Diğer).
   - `kaynakMetin` TEXT: kullanıcının verdiği orijinal metin, değiştirilmeden.
     Ofisin kendi veritabanında durur; inceleyen kişi alanlarla yan yana görür.
   - `cikarimDetayi` RAW_JSON: denetim izi. Şekil:
     `{ maskedText, evidence: { <alan>: <metinden parça> }, missingFields: string[],
     unmapped: string[], model: string, agentUniversalIdentifier: string,
     extractedAt: ISO-8601, outcome: 'ok' | 'extraction-failed' }`.
   - Görünüm "Onay Bekleyen Talepler": `buyerRequest`, filtre `status = TASLAK`,
     sıralama oluşturulma tarihi azalan; görünür alanlar: kişi, kaynak, ilan tipi,
     kategori, ilçeler, bütçe üst, oda planları, oluşturulma tarihi.
   - Taslak başına bir Görev: başlık `Taslak talebi onayla: <kişi adı>`; gövde:
     eksik alanlar listesi + "Onay Bekleyen Talepler" yönlendirmesi; talebe ve
     kişiye bağlı; atanan: sweeper görevleriyle aynı (atanmamış). Rota yükü çağıran
     workspace üyesini veriyorsa ona atanır; bu, plan aşamasında doğrulanır ve
     sonuca göre tek satırlık bir seçimdir, davranışı değiştirmez.

2. **Çekirdek fonksiyon `talep-cikar`** — `defineLogicFunction`, handler
   `src/intake/run-intake.ts` içindeki saf `runIntake(client, metadataClient,
   input, now)`; sweeper'larla aynı iskelet (`CoreApiClient` kayıt erişimi için).
   - Girdi: `{ personId: string; text: string; kaynak?: Kaynak }`. `text` kırpılmış
     en az 10 karakter; `personId` var olan bir Kişi olmalı; aksi halde hata.
   - Adımlar: (a) kişiyi oku (ad, soyad, telefonlar); (b) maskele (madde 4);
     (c) maskeli metni çıkarım ajanına ver (madde 3) — `twenty-client-sdk`
     metadata istemcisi üzerinden `runAgent`; (d) doğrula/normalize et (madde 5);
     (e) `buyerRequest` oluştur: `status = TASLAK`, kişi bağlantısı (mevcut
     "buyer on request" ilişkisi), `kaynak`, `kaynakMetin`, `cikarimDetayi`,
     kriter alanları; (f) görevi oluştur; (g) `{ draftId, missingFields,
     summary }` döndür. `summary` kişisel veri içermez (yalnızca kriterler).
   - Tetikleyiciler (v1): `httpRouteTriggerSettings` `{ path: '/talep/cikar',
     httpMethod: 'POST', isAuthRequired: true }`. Rota handler'ı yalnızca gövdeyi
     ayrıştırır, çekirdeği çağırır, `Response` ile 200 / 400 / 404 / 500 döner
     (`document-generator` örneğindeki `generate-document-route` deseni).
     `toolTriggerSettings` v1'de YOK (madde "Kapsam dışı").
   - Zaman aşımı 60 sn. Çıkarım ajanı hata verir veya JSON şemaya uymazsa bir kez
     tekrar; yine başarısızsa yalnızca `kaynakMetin` + `cikarimDetayi.outcome =
     'extraction-failed'` ile TASLAK açılır ve görev yine oluşturulur. Talep asla
     kaybolmaz.

3. **Çıkarım ajanı `talep-cikarici`** — `defineAgent`, model
   `deepseek/deepseek-flash`, `responseFormat: { type: 'json', schema }`.
   - Rol: yeni `defineRole` "Talep Çıkarıcı" — hiçbir nesnede okuma/yazma yok,
     `canAccessAllTools: false`, `canBeAssignedToAgents: true`. Ajanın hiçbir aracı
     ve veri erişimi yoktur; saf metin → JSON. (Salt-okunur Emlak Asistanı bu işe
     karışmaz.)
   - Şema (tüm alanlar `null` olabilir; kapalı sözlükler mevcut seçeneklerden):
     `category` (PROPERTY_SELECT_OPTIONS.category değerleri), `listingType`
     (…listingType), `rooms: string[]` (…rooms), `districts: string[]` (İzmir ilçe
     listesi, madde 5), `features: string[]` ve `excludedFeatures: string[]`
     (AMENITY_UNION_OPTIONS değerleri), `budgetMin` ve `budgetMax`
     `{ amount: number, currency: 'TRY' | 'EUR' | 'USD' }`, `sqmNetMin: number`,
     `leftover: string` (eşlenemeyen her şey, serbest metin, Türkçe), `evidence:
     Record<string, string>` (alan → metindeki dayanak parçası).
   - Prompt kuralları: yalnızca metinde geçeni çıkar; uydurma; geçmiyorsa `null`;
     değeri sözlüğe eşle, eşleyemediğini `leftover`'a yaz; tutarları sayıya çevir
     ("1.2 milyon euro" → 1200000 EUR); Türkçe; metindeki `[MÜŞTERİ]`,
     `[TELEFON_n]`, `[EPOSTA_n]` yer tutucularını yok say.

4. **Kişisel veri maskeleme (kod, LLM'den önce)** — `src/intake/mask-pii.ts`,
   saf, birim testli.
   - Telefon: Türkiye cep ve sabit hat desenleri (`+90`/`0090`/`0` önekli, boşluk,
     nokta, tire veya parantez ayraçlı 10 hane) → `[TELEFON_1]`, `[TELEFON_2]`…
   - E-posta → `[EPOSTA_n]`.
   - Kişi adı: kişinin ad ve soyadı (ve tam ad) metinde tam kelime olarak,
     büyük/küçük harf ve Türkçe aksan duyarsız (İ/I/ı/i, Ş/S…) aranır →
     `[MÜŞTERİ]`.
   - İddia: maskeleme sonrası metinde telefon deseni, e-posta veya kişi adı
     kalmışsa fonksiyon ajanı ÇAĞIRMAZ, `extraction-failed` yoluyla taslak açar ve
     `cikarimDetayi.unmapped`'e "maskeleme eksik" notu düşer. Ham metin sunucu
     loglarına yazılmaz; yalnızca `kaynakMetin` alanında saklanır.

5. **Doğrulama ve normalizasyon (kod)** — `src/intake/normalize-draft.ts`,
   zod + saf fonksiyonlar, birim testli. LLM çıktısına güvenilmez; geçmeyen alan
   `null` olur ve `missingFields`'a girer.
   - Tutar: Türkçe sayı/çarpan ayrıştırma ("5m", "5 milyon", "1.2 milyon euro",
     "4.150.000 TL", "500 bin"); para birimi metinden (euro/€ → EUR, dolar/$ →
     USD, aksi TRY); `amountMicros`/`currencyCode` olarak CURRENCY alanına yazılır.
   - İlçe: yeni `src/constants/izmir-districts.ts` — İzmir'in 30 ilçesi + alias'lar
     (ör. "Çeşme merkez" → Çeşme; mahalle adları Alaçatı → Çeşme, Gümüldür →
     Menderes, Mordoğan → Karaburun). Mahalle eşlemesi `leftover`/notlara da
     yazılır. Sonuç `districts` TEXT alanına virgülle ayrılmış kanonik ad.
   - Oda: "4 veya 5 oda", "4+1/5+1", "3 artı bir" → mevcut `rooms` seçenekleri.
   - Özellikler: sözlükteki değerler; eşlenemeyen `leftover`'a.
   - `leftover` ve eşlenemeyenler `notes` alanına `[otomatik] ` önekiyle eklenir;
     yeni alan açılmaz (amaç, zamanlama, öncelikli bölge, hariç tutmalar notlarda
     kalır).

6. **Giriş yüzeyi** — `document-generator` örneğiyle aynı desen.
   - `defineCommandMenuItem` `metinden-talep-cikar`: etiket "Metinden talep çıkar",
     `availabilityType: 'RECORD_SELECTION'`, nesne Kişi
     (`STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person`), bir Kişi seçiliyken görünür.
   - `defineFrontComponent` `talep-cikar-form` (yan panel): metin alanı (zorunlu,
     ≥10 karakter), kaynak seçimi (opsiyonel), "Taslak çıkar" düğmesi; kişi kimliği
     `useFrontComponentExecutionContext().selectedRecordIds[0]`; birden fazla kayıt
     seçiliyse uyarı gösterir ve çalışmaz. Gönderim:
     `new RestApiClient().post('/s/talep/cikar', { personId, text, kaynak })`.
     Başarıda snackbar ("Taslak talep oluşturuldu; onay için Talepler → Onay
     Bekleyen"), eksik alanlar varsa listelenir, `navigate` ile taslağa gidilir,
     panel kapanır. Hatada snackbar + metin korunur.
   - Türkçe/İngilizce etiketler mevcut `metadataLabel`/`trLabel` mekanizmasıyla;
     `locales/tr-TR.json` güncellenir (`yarn i18n:extract && yarn i18n:fill`).

7. **Onay akışı** — inceleyen kişi "Onay Bekleyen Talepler"de `kaynakMetin` ile
   alanları yan yana görür, düzeltir, `status`'u AKTİF yapar → mevcut
   `match-request-on-update` (`updatedFields` içinde `status`) anlık eşleşmeyi
   çalıştırır. Reddetmek = `IPTAL`. Twenty Form step'ine bağımlılık yok.

8. **Eval** — `apps/emlak-app/evals/talep-cikarimi/`, sohbet asistanı
   harness'ının deseni: `scenarios.ts` (≈15; üsluplar: WhatsApp emoji/kısaltmalı,
   STT dolgu kelimeli/ASR hatalı, defter telegrafik; içerik: tam talep, eksik
   bütçe, yalnızca ilçe, EUR bütçe, çoklu ilçe, hariç tutmalar, talep olmayan metin),
   her senaryoda beklenen alan değerleri ve yazılı geçme tanımı; `check-draft.ts`
   otomatik kontroller: alan eşitliği, uydurulmuş alan yok, maskeli prompt'ta PII
   yok; `scripts/run-intake-eval.ts` → `yarn eval:intake <model-label>`; rapor
   `results/<YYYY-MM-DDTHHmm>-<label>.md`, insan kararı nihai. Eval gerçek
   kişi/telefon içermez (uydurma isim ve numara).

9. **Testler** — vitest: `mask-pii` (telefon biçimleri, e-posta, aksan duyarsız
   ad, iddia), `normalize-draft` (tutar/para birimi, ilçe alias, oda, özellik,
   leftover → notlar), `run-intake` (başarı, çıkarım-başarısız yolu, kişi yok,
   kısa metin) sahte istemcilerle. Uçtan uca: Playwright ile Kişi → komut → form →
   taslak → onay → eşleşme ekran görüntüleri.

10. **İzinler** — uygulama rolü `buyerRequest` ve `task` oluşturabilmeli (sweeper
    görevleri aynı yoldan oluştuğu için mekanizma mevcut; `buyerRequest` için
    doğrulanır). Çıkarım ajanının rolü sıfır erişimli.

## Kapsam dışı (v1)

- Sohbet adaptörü (`toolTriggerSettings`): sohbete yapıştırılan metin sohbet
  LLM'inden geçtiği için PII ilkesini bozar. Ancak sohbet ajanının yalnızca bir
  kayıt kimliği (not/kişi) taşıdığı ve metni sunucu tarafında bizim okuduğumuz bir
  tasarımla, @bahsetmenin kayıt gövdesini prompt'a enjekte etmediği doğrulanırsa
  eklenir. Ayrı iş.
- `note.created` ile otomatik çıkarım; STT pipeline'ı (rota hazır olur, STT yok).
- Kişi oluşturma veya kişi eşleştirme (kişi yoksa ofis önce normal arayüzden
  açar). İsim çıkarımı yapılmaz.
- Mevcut bir talebi yeni metinden güncelleme; aynı kişiye ikinci taslak
  açılabilir, birleştirme yok.
- Yeni kriter alanları (amaç, zamanlama, öncelikli bölge, hariç tutmalar):
  notlarda kalır.

## Riskler ve karşılıklar

- **Çıkarım kalitesi (flash)**: eval seti ölçer; ≥%80 altında kalırsa önce prompt,
  sonra model (v4-pro) denenir; karar owner'ın.
- **Maskeleme kaçağı**: iddia + eval; kaçak varsa ajan çağrılmaz.
- **Taslak kirliliği**: esnek politika çöp taslak üretebilir; görünüm + görev
  görünür kılar, İPTAL ucuz.
- **Rota kimlik bilgisi**: `isAuthRequired: true`; çağıran kullanıcının oturumu
  `RestApiClient` ile gider (`document-generator` ile aynı).

## Uygulama notları (plan aşamasında doğrulanacak, davranışı değiştirmez)

- `twenty-client-sdk` metadata istemcisinde `runAgent` çağrısının tam imzası ve
  logic function çalışma zamanında kimlik doğrulaması.
- `RoutePayload` içinde çağıran workspace üyesi kimliğinin bulunup bulunmadığı
  (görev ataması için).
- Uygulama rolünün `buyerRequest` oluşturma izni.
- Komut menüsü öğesi ve front component için `yarn twenty dev:add` ile üretilen
  kimlikler.

## Dosya planı

- `apps/emlak-app/src/objects/buyer-request.object.ts` (TASLAK, kaynak,
  kaynakMetin, cikarimDetayi)
- `apps/emlak-app/src/views/onay-bekleyen-talepler.view.ts`
- `apps/emlak-app/src/constants/izmir-districts.ts`, `src/constants/intake-ids.ts`
- `apps/emlak-app/src/intake/mask-pii.ts`, `normalize-draft.ts`, `run-intake.ts`
  (+ `__tests__/`)
- `apps/emlak-app/src/logic-functions/talep-cikar-route.ts`
- `apps/emlak-app/src/agents/talep-cikarici.agent.ts`,
  `src/roles/talep-cikarici.role.ts`
- `apps/emlak-app/src/command-menu-items/metinden-talep-cikar.command-menu-item.ts`
- `apps/emlak-app/src/front-components/talep-cikar-form.front-component.tsx`
- `apps/emlak-app/evals/talep-cikarimi/*`, `scripts/run-intake-eval.ts`,
  `package.json` (`eval:intake`)
- `docs/HANDOFF.md` (özellik notu), `locales/tr-TR.json`
