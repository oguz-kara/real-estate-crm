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

## Claude cloud oturumunda ÖN KOŞULLAR

İki ayrı katman var; ikisi de owner'ın elindedir:

1. **İzin kuralı** (ÇÖZÜLDÜ, 2026-10-07): `.claude/settings.json` →
   `permissions.allow` listesinde
   `"Bash(bash packages/twenty-utils/preview-deploy.sh*)"` duruyor
   (owner'ın "kural ekle" talimatıyla eklendi). Script artık izin
   engeline takılmıyor.
2. **Konteyner ağ mimarisi** (YAPISAL ENGEL, 2026-10-07'de doğrulandı):
   cloudflared quick tunnel kayıt olabiliyor (URL üretiliyor, 443/HTTPS
   proxy üzerinden) ama edge veri bağlantısı `*.argotunnel.com` adresine
   **7844 portundan** (QUIC/UDP ve HTTP2/TCP) gider. Bu konteynerde TÜM
   dış trafik bir HTTPS proxy'den (yalnızca 443) akar ve ortamın Network
   access ayarı **Full iken bile** 7844 kapalıdır — ayar değil, mimari.
   Yani cloudflared quick tunnel BU ORTAMDA ÇALIŞMAZ; tekrar denemek
   boşunadır.

**ngrok da ELENDİ (2026-10-07):** konteynerin proxy dokümantasyonu
(`/root/.ccr/README.md`) sertifika pinleyen istemcileri ve ngrok'u İSMEN
"proxy üzerinden desteklenmez; dolanma, raporla" listesine koyuyor (proxy
TLS'i yeniden sonlandırır, ngrok ajanı pinleme yüzünden reddeder).
WebSocket upgrade ve 443 dışı portlar da desteklenmediğinden tünel
tabanlı HİÇBİR çözüm (cloudflared, ngrok, SSH/localtunnel türevleri) bu
konteynerde çalışmaz. SONUÇ: konteyner içinden herkese açık önizleme
MÜMKÜN DEĞİL; bu dosyadaki script yalnızca yerel (kendi makinende
çalışan) ortamlar için anlamlıdır.

Kalan gerçek yol: **Railway/Render** üzerinde kısa süreli gerçek deploy
(build onların altyapısında GitHub'dan çekilir, konteyner ağına takılmaz)
— ayrı, daha büyük iş; owner isterse kendi spec'iyle planlanır.

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
