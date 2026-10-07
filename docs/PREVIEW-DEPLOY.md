# Kısa süreli önizleme deploy'u (cloudflared quick tunnel)

Owner'ın "kısa süreli deploy et" dediği işlem budur: dev ortamındaki Twenty,
cloudflared quick tunnel ile geçici bir `https://...trycloudflare.com` adresinden
herkese açık hale getirilir. Amaç dakikalar/saatler süren denetim; kalıcı
yayınlama DEĞİLDİR.

## Tek komutluk akış

```bash
bash packages/twenty-utils/preview-deploy.sh up    # tünelleri açar, env'leri tünele çevirir
# → script dev stack'in yeniden başlatılmasını ister (yarn start)
# → "front:" satırındaki URL owner'a verilir

bash packages/twenty-utils/preview-deploy.sh down  # tünelleri kapatır, env'leri localhost'a döndürür
# → tekrar yarn start
```

Script iki tünel açar (server 3000 + front 3001) ve üç env değerini çevirir:
`SERVER_URL`, `FRONTEND_URL` (twenty-server/.env), `REACT_APP_SERVER_BASE_URL`
(twenty-front/.env). URL'ler `.preview-deploy/urls.txt`'de durur.

## Claude cloud oturumunda izin ÖN KOŞULU

Claude Code cloud sandbox'ı, dışarı tünel açmayı ("External Ingress Tunnel")
varsayılan olarak ENGELLER — cloudflared indirme adımı bile reddedilir ve Claude
bu engeli başka araçla dolanmaz/dolanmamalıdır. Owner'ın BİR KEZ izin kuralı
eklemesi gerekir:

- Proje izin dosyası `.claude/settings.json` içinde `permissions.allow` listesine:
  `"Bash(bash packages/twenty-utils/preview-deploy.sh*)"`
  (veya oturumda `/permissions` ekranından aynı kural).
- Kuralı Claude kendisi EKLEMEZ (kendi kendine yetki genişletme sayılır);
  owner ekler veya owner'ın açık onayıyla eklenir.
- Kural buna rağmen sandbox sınıflandırıcısına takılırsa bu yol bu ortamda
  kapalıdır; alternatif gerçek kısa süreli deploy'dur (Railway/Render — ayrı iş).

## Güvenlik gerçekleri (owner bunları kabul etti: 2026-10-07)

- URL'yi bilen HERKES girer; dev giriş bilgisi basittir (`tim@apple.dev`).
- Bu yüzden: kısa tut, işin bitince `down` çalıştır, URL'yi yalnızca
  göstereceğin kişiyle paylaş.
- Konteyner uykuya geçince tünel ölür; link kalıcı değildir.
- Gerçek müşteri verisi taşıyan bir workspace'i uzun süre açık BIRAKMA.

## Claude için yapılacaklar listesi ("kısa süreli deploy et" dendiğinde)

1. Dev stack çalışmıyorsa: `bash packages/twenty-utils/setup-dev-env.sh` →
   `.env`'e AI_PROVIDERS satırını yeniden ekle (setup script sıfırlar;
   HANDOFF'a bak) → `yarn start` (arka plan).
2. `preview-deploy.sh up` → izin reddedilirse owner'a yukarıdaki kural
   adımını hatırlat ve DUR.
3. Stack'i yeniden başlat, healthz bekle, front URL'sini kısa bir
   "giriş: Continue → Sign in" notuyla owner'a ver.
4. Owner "bitti" deyince: `preview-deploy.sh down` + stack'i yeniden başlat.
