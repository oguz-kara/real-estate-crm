# Plan: Emlak Asistanı v1 (DeepSeek, salt-okunur)

Spec: `docs/superpowers/specs/2026-10-07-ai-chat-assistant-design.md`
Ledger: `.superpowers/sdd/2026-10-07-ai-chat-assistant/progress.md`
Doğrulanmış zemin: `AI_PROVIDERS` (JSON config) özel sağlayıcıyı kataloğa
birleştirir (apiKey OPSİYONEL → anahtar gelmeden kayıt yapılabilir);
`@ai-sdk/openai-compatible` izinli pakettir; `AgentManifest{prompt, modelId,
roleUniversalIdentifier}`; `RoleManifest{canReadAllObjectRecords,
canUpdateAll/SoftDelete/DestroyAllObjectRecords, canBeAssignedToAgents,
canAccessAllTools}`.

## Task 1 — DeepSeek sağlayıcı kaydı + duman testi

- `packages/twenty-server/.env` → `AI_PROVIDERS` JSON: `deepseek` girdisi
  (`npm: @ai-sdk/openai-compatible`, `baseUrl: https://api.deepseek.com`,
  model kayıtları `deepseek-v4-pro`, `deepseek-flash`; model alanlarının
  asgari seti `aiProviderModelConfigSchema`'dan implementasyonda doğrulanır).
  Anahtar GELMEDEN girdi yapılır (apiKey opsiyonel); anahtar gelince eklenir.
- Sunucu yeniden başlat → modellerin kayıtlı olduğunu doğrula (model listesi
  sorgusu / ajan model seçiminde görünürlük).
- **Duman testi (anahtar geldikten sonra):** deepseek-v4-pro ile tek Türkçe
  sorgu + bir araç/nesne-okuma çağrısının uçtan uca çalıştığı kanıtlanır;
  `ai-billing`'de harcama satırı görünür. Başarısızsa: bulgular + alternatif
  önerilerle owner'a dön (plan durur).
- .env git'e girmez; HANDOFF'a kurulum satırı yazılır.

## Task 2 — Salt-okunur rol + Emlak Asistanı ajanı

- `src/roles/asistan-okur.role.ts` (`defineApplicationRole`):
  `canReadAllObjectRecords: true`; `canUpdateAllObjectRecords/
  canSoftDeleteAllObjectRecords/canDestroyAllObjectRecords/
  canUpdateAllSettings: false`; `canBeAssignedToAgents: true`;
  `canAccessAllTools: false` (araç erişimi yazma riski taşıyan sweeper/match
  araçlarını da kapsadığından kapalı; arama ihtiyacını ajanın rolüyle yapılan
  yerleşik kayıt-okuma hattı karşılar — implementasyonda `native-tool-binder`
  üzerinden doğrulanır; okuma-araçları bağlanamıyorsa karar owner'a:
  v1 araçsız-okuma mı, search_properties için izin genişletme mi).
- `src/agents/emlak-asistani.agent.ts` (`defineAgent`): Türkçe prompt —
  rol, yetki sınırı (salt-okunur; silme/değiştirme isteklerini reddet),
  dürüstlük kuralları (veride olmayanı uydurma; spekülasyon istenirse
  "bu veriden çıkarılamaz"), üslup (kısa, Türkçe); `modelId: deepseek-v4-pro`;
  `roleUniversalIdentifier` → yeni rol.
- `yarn twenty apply` → ajan sohbette seçilebilir; psql ile rol bayrakları.
- **Yazamazlık kanıtı:** ajana canlıda "şu kaydı sil / telefonu değiştir"
  denir → DB'de değişiklik olmadığı sorguyla gösterilir (anahtar geldikten
  sonra; anahtar yokken bu adım Task 4'e taşınır).

## Task 3 — Test seti + koşucu (anahtar gerektirmez)

- `evals/chat-assistant/scenarios.ts`: ~15 senaryo
  `{ id, category: 'dogru-cevap'|'bilmiyorum'|'reddet'|'tuzak', prompt,
  gecmeTanimi, otomatikKontroller: {beklenenAracVarMi?, yasakliIfadeler?,
  bosSonucBeklenir?} }`. İçerik gerçek portföy verisine göre yazılır
  (Bornova/Karaburun örnekleri mevcut 41 ilandan).
- RED→GREEN: `evals/chat-assistant/__tests__/check-answer.test.ts` —
  otomatik kontrol fonksiyonları (yasaklı ifade, boş-sonuçta portföy adı
  halüsinasyonu, araç çağrısı varlığı) önce stub testle.
- `scripts/run-chat-eval.ts`: her senaryo için yeni sohbet thread'i açar
  (ai-chat API, kullanıcı token'ı), cevabı + araç çağrılarını toplar,
  otomatik kontrolleri uygular, raporu
  `evals/chat-assistant/results/<tarih>-<model>.md`'ye yazar (model adı
  parametre). `package.json`: `eval:chat`.
- Yazma-denetimi: koşucu, koşu öncesi/sonrası kayıt sayılarını (person,
  property, buyerRequest, propertyMatch, task, note) karşılaştırıp rapora
  "yazma: YOK/VAR" satırı ekler.

## Task 4 — Koşular, karar verisi, kapanış

- DeepSeek V4-Pro tam koşu → rapor + geçme oranı; (owner Anthropic anahtarı
  verirse) aynı set Haiku 4.5 ve Opus 5.5 ile → karşılaştırma tablosu.
- Sohbet UI'dan 2-3 ekran görüntüsü owner'a; sonuç özeti (geçme oranı,
  kategori kırılımı, maliyet gözlemi).
- HANDOFF + ledger; commit + push; tek-ajanlık dar fresh-review + tek fix
  pass (owner bütçe talimatına uygun).

## Sıralama ve bağımlılık

Anahtar beklenmeden: Task 1'in env girdisi, Task 2, Task 3 tamamı.
Anahtar gelince: Task 1 duman testi → Task 2 yazamazlık kanıtı → Task 4.
