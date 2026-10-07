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
2. **Konteyner ağ politikası** (ŞU AN ENGELLİ): cloudflared quick tunnel
   kayıt olabiliyor (URL üretiliyor) ama edge veri bağlantısı
   `*.argotunnel.com` adresine **7844 portundan** (QUIC/UDP ve HTTP2/TCP)
   gider — cloud ortamının ağ politikası 443 dışını kesiyor, tünel 530
   döner. Çare: oturum başlığındaki ortam menüsü → Edit → **Network
   access** seviyesini genişletmek (veya Allowed domains'e
   `*.argotunnel.com` eklemek; proxy yalnızca 443'e izin veriyorsa bu da
   yetmeyebilir — o durumda tek yol daha geniş ağ seviyesidir).
   Owner ayarı değiştirdikten sonra "kısa süreli deploy et" yeter.

Ağ da açılamazsa bu yol bu ortamda kapalıdır; alternatif gerçek kısa
süreli deploy'dur (Railway/Render — ayrı iş).

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
