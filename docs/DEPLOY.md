# Dokploy ile production kurulumu

Bu rehber Emlak CRM'i Dokploy arayüzünden bir VPS'e kurar. Twenty çekirdeği değiştirilmediği için resmî `twentycrm/twenty:v2.44.0` imajı kullanılır; kendi kodumuz (`apps/emlak-app`) kurulumdan sonra `yarn twenty apply` ile yüklenir.

Stack tanımı: `deploy/dokploy/docker-compose.yml`. Değişken şablonu: `deploy/dokploy/.env.example`. Sırlar sadece Dokploy'un Environment sekmesinde durur, asla git'te değil.

Dokploy'un menü adları sürüme göre küçük farklar gösterebilir. Aşağıdaki adlar Dokploy'un güncel arayüzüne göredir.

## Ön koşullar

- VPS'te en az 4 GB RAM; 8 GB rahat çalışır. Twenty sunucusu ve worker birlikte yaklaşık 2,5 GB kullanır.
- Alan adının A kaydı VPS'in IP adresini gösteriyor.
- Dokploy'a GitHub bağlı ve `oguz-kara/real-estate-crm` reposunu görüyor.
- Yeni bir DeepSeek API anahtarı. Geliştirmede kullanılan anahtarı production'da kullanma.

## 1. Sırları üret

VPS terminalinde (veya herhangi bir terminalde) iki değer üret ve bir yere kaydet:

```bash
openssl rand -hex 24      # PG_DATABASE_PASSWORD
openssl rand -base64 32   # ENCRYPTION_KEY
```

`ENCRYPTION_KEY` değerini bir şifre yöneticisine yedekle. Kaybolursa Twenty'nin veritabanında şifreli tuttuğu değerler okunamaz.

## 2. Compose servisini oluştur

1. Dokploy → **Projects** → **Create Project**, ad: `emlak-crm`.
2. Proje içinde **Create Service** → **Compose**, ad: `twenty`.
3. Servisin **General** sekmesinde:
   - Provider: **GitHub**
   - Repository: `oguz-kara/real-estate-crm`
   - Branch: `local-dev`
   - Compose Path: `./deploy/dokploy/docker-compose.yml`
   - Compose Type: **Docker Compose**
   - **Autodeploy** kapalı. Açık kalırsa repoya yapılan her push, doküman değişikliği dahil, stack'i yeniden başlatır.
4. **Save**.

## 3. Ortam değişkenlerini gir

Servisin **Environment** sekmesine şu satırları yapıştır ve köşeli parantezli yerleri doldur:

```
TAG=v2.44.0
SERVER_URL=https://[alan-adın]
PG_DATABASE_PASSWORD=[1. adımdaki hex değer]
ENCRYPTION_KEY=[1. adımdaki base64 değer]
STORAGE_TYPE=local
LOGIC_FUNCTION_TYPE=LOCAL
AI_PROVIDERS='{"deepseek":{"npm":"@ai-sdk/openai-compatible","name":"deepseek","label":"DeepSeek","baseUrl":"https://api.deepseek.com","apiKey":"[DEEPSEEK ANAHTARI]","models":[{"name":"deepseek-flash","label":"DeepSeek Flash","inputCostPerMillionTokens":0.3,"outputCostPerMillionTokens":1.2,"contextWindowTokens":1000000,"maxOutputTokens":384000},{"name":"deepseek-v4-pro","label":"DeepSeek V4 Pro","inputCostPerMillionTokens":1.32,"outputCostPerMillionTokens":3.96,"contextWindowTokens":1000000,"maxOutputTokens":384000}]}}'
```

Dikkat edilecekler:

- `SERVER_URL` sonunda `/` olmadan ve `https://` ile yazılır.
- `AI_PROVIDERS` tek satırdır ve tek tırnak içinde kalır.
- `LOGIC_FUNCTION_TYPE=LOCAL` şart. Twenty bu ayarı production'da varsayılan olarak kapalı başlatır; kapalı kalırsa gece taramaları, eşleştirme ve metinden talep girişi çalışmaz.
- `SERVER_URL`, `PG_DATABASE_PASSWORD`, `ENCRYPTION_KEY` veya `AI_PROVIDERS` eksikse deploy bilerek hata verir.

**Save**.

## 4. Alan adını bağla

Servisin **Domains** sekmesinde **Add Domain**:

| Alan | Değer |
| --- | --- |
| Service Name | `server` |
| Host | `[alan-adın]` |
| Path | `/` |
| Container Port | `3000` |
| HTTPS | açık |
| Certificate | Let's Encrypt |

Sadece `server` servisine alan adı verilir. Veritabanı, Redis ve worker dışarıya açılmaz.

## 5. Deploy et

1. Servisin üstündeki **Deploy** düğmesine bas.
2. İlk açılış 2-4 dakika sürer, çünkü sunucu veritabanını kurar.
3. **Logs** sekmesinde `server` konteynerinde şu iki satırı gör:
   - `Successfully migrated DB!`
   - `Successfully registered all background sync jobs!`
4. Tarayıcıda `https://[alan-adın]/healthz` adresi `{"status":"ok"}` benzeri bir cevap dönmeli.

İkinci satır önemli: Emlak'ın gece taramaları bu cron kaydına bağlı. Production imajı kaydı her açılışta kendisi yapar.

## 6. Çalışma alanını kur

1. `https://[alan-adın]` adresini aç ve kendi e-postanla kaydol. İlk kayıt çalışma alanını oluşturur ve seni yönetici yapar. Bundan sonra başkası davetsiz kaydolamaz.
2. **Ayarlar → Deneyim → Dil**: Türkçe.
3. **Ayarlar → AI**: varsayılan modeli **DeepSeek Flash** yap. Anthropic veya OpenAI anahtarı olmadığı için varsayılan model çalışmaz.
4. **Ayarlar → MCP ve API'ler → API anahtarı oluştur**. Anahtarı kopyala; sonraki adımda lazım.

## 7. Emlak uygulamasını yükle

Bu adım arayüzden yapılamaz, terminal ister. Node 24 ve Yarn kurulu olan herhangi bir makineden çalıştırılabilir: kendi bilgisayarın ya da VPS.

```bash
git clone -b local-dev https://github.com/oguz-kara/real-estate-crm.git   # zaten varsa: git pull
cd real-estate-crm/apps/emlak-app
corepack enable
yarn install
yarn twenty remote:add --as prod --url https://[alan-adın] --api-key [API ANAHTARI]
yarn twenty remote:use prod
yarn twenty remote:status   # "prod" ve doğru URL'i gösterdiğini kontrol et
yarn twenty apply
```

`apply` portföy, talep ve eşleşme nesnelerini, görünümleri, gece taramalarını, ajanları ve metinden talep giriş formunu production'a kurar. Bittiğinde sol menüde **Portföyler** ve **Talepler** görünür.

## 8. Portföyü içe aktar (isteğe bağlı)

Gerçek sahibinden ilanlarını yüklemek için, yine `apps/emlak-app` içinde:

```bash
export TWENTY_BASE_URL=https://[alan-adın]
export TWENTY_API_KEY=[API ANAHTARI]
yarn import:sahibinden data/sahibinden-izmir-2026-10-06.json --dry-run   # önce rapor
yarn import:sahibinden data/sahibinden-izmir-2026-10-06.json             # sonra gerçek aktarım
```

Tekrar çalıştırmak güvenlidir; aynı ilan iki kez oluşmaz.

## 9. Kontrol listesi

- [ ] Bir kişi aç, ⌘K → **Metinden talep çıkar** ile örnek bir metin gönder. **Talepler → Onay Bekleyen Talepler** görünümünde taslak çıkmalı.
- [ ] Taslağın durumunu **Aktif** yap. Uygun portföy varsa birkaç saniye içinde talebin **Eşleşmeler** listesi dolar.
- [ ] Ertesi sabah **Görevler** listesinde gece taramalarının açtığı görevler (varsa) görünür.

## Güncelleme

- **Emlak uygulamasında değişiklik:** `git pull`, sonra `apps/emlak-app` içinde `yarn twenty apply`. Dokploy'da yeniden deploy gerekmez.
- **Twenty sürümünü yükseltme:** önce `apps/emlak-app/package.json` içindeki `twenty-sdk` ve `twenty-client-sdk` sürümlerini aynı sürüme çek ve uygulamayı test et. Sonra Dokploy'da `TAG` değerini değiştirip deploy et ve `yarn twenty apply` çalıştır. `TAG` tek başına değiştirilmez.

## Yedekleme

- **Veritabanı:** Dokploy'un **Backups** özelliği bir S3 hedefi ister. Hedef yoksa VPS'te günlük bir `pg_dump` cron'u kur ve dosyayı makine dışına kopyala.
- **Dosyalar:** `server-local-data` volume'u yüklenen ekleri tutar; aynı yedeğe dahil edilmeli.
- **`ENCRYPTION_KEY`:** veritabanı yedeği bu anahtar olmadan eksik kalır.

## Yapılmaması gerekenler

- VPS'te `yarn start`, `setup-dev-env.sh` veya `database:reset` çalıştırma. Bunlar geliştirme komutlarıdır; sahte kullanıcılar ve demo veri üretirler.
- Postgres (5432), Redis (6379) veya 3000 portunu dışarı açma.
- DeepSeek anahtarını veya `ENCRYPTION_KEY`'i repoya, issue'ya ya da PR açıklamasına yazma.
