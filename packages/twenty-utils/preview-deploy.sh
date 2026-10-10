#!/usr/bin/env bash
# Kısa süreli herkese açık önizleme: cloudflared quick tunnel ile front (3001)
# ve server (3000) dışarı açılır, Twenty'nin URL ayarları tünele çevrilir.
#
#   bash packages/twenty-utils/preview-deploy.sh up     # tünelleri kur, URL'leri yaz
#   bash packages/twenty-utils/preview-deploy.sh down   # tünelleri kapat, localhost'a dön
#
# GEREKSİNİMLER / NOTLAR (docs/PREVIEW-DEPLOY.md'de ayrıntısı var):
# - Claude cloud oturumunda izin denetleyicisi "External Ingress Tunnel"i
#   varsayılan olarak engeller; bu scriptin çalışması için kullanıcının izin
#   kuralı eklemesi gerekir.
# - URL herkese açıktır; dev ortam şifresi basittir. İş bitince MUTLAKA
#   `down` çalıştırın.
# - `up` env dosyalarını değiştirir ve dev stack'in yeniden başlatılmasını
#   gerektirir (script söyler); `down` localhost değerlerini geri yazar.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="$REPO_ROOT/.preview-deploy"
BIN="$STATE_DIR/cloudflared"
SERVER_ENV="$REPO_ROOT/packages/twenty-server/.env"
FRONT_ENV="$REPO_ROOT/packages/twenty-front/.env"

ensure_binary() {
  mkdir -p "$STATE_DIR"
  if [ ! -x "$BIN" ]; then
    echo "cloudflared indiriliyor..."
    curl -sL -o "$BIN" \
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x "$BIN"
  fi
  "$BIN" --version
}

start_tunnel() {
  local port="$1" logfile="$2"
  nohup "$BIN" tunnel --url "http://localhost:$port" --no-autoupdate \
    > "$logfile" 2>&1 &
  echo $! > "$logfile.pid"
  # quick tunnel URL loga düşer; 30 sn bekle
  for _ in $(seq 1 30); do
    local url
    url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$logfile" | head -1 || true)
    if [ -n "$url" ]; then echo "$url"; return 0; fi
    sleep 1
  done
  echo "HATA: $port için tünel URL'si alınamadı ($logfile)" >&2
  return 1
}

set_env() {
  local file="$1" key="$2" value="$3"
  if grep -q "^$key=" "$file"; then
    sed -i "s|^$key=.*|$key=$value|" "$file"
  elif grep -q "^# *$key=" "$file"; then
    sed -i "s|^# *$key=.*|$key=$value|" "$file"
  else
    echo "$key=$value" >> "$file"
  fi
}

case "${1:-}" in
  up)
    ensure_binary
    SERVER_URL=$(start_tunnel 3000 "$STATE_DIR/server-tunnel.log")
    FRONT_URL=$(start_tunnel 3001 "$STATE_DIR/front-tunnel.log")
    set_env "$SERVER_ENV" SERVER_URL "$SERVER_URL"
    set_env "$SERVER_ENV" FRONTEND_URL "$FRONT_URL"
    set_env "$FRONT_ENV" REACT_APP_SERVER_BASE_URL "$SERVER_URL"
    cat > "$STATE_DIR/urls.txt" << URLS
front: $FRONT_URL
server: $SERVER_URL
URLS
    echo ""
    echo "Tüneller hazır:"
    cat "$STATE_DIR/urls.txt"
    echo ""
    echo "ŞİMDİ: dev stack'i yeniden başlatın (yarn start). Giriş sayfası: $FRONT_URL"
    echo "BİTİNCE: bash packages/twenty-utils/preview-deploy.sh down"
    ;;
  down)
    for f in "$STATE_DIR"/*.pid; do
      [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null || true
      rm -f "$f"
    done
    set_env "$SERVER_ENV" SERVER_URL "http://localhost:3000"
    set_env "$SERVER_ENV" FRONTEND_URL "http://localhost:3001"
    set_env "$FRONT_ENV" REACT_APP_SERVER_BASE_URL "http://localhost:3000"
    rm -f "$STATE_DIR/urls.txt"
    echo "Tüneller kapatıldı, env localhost'a döndü. Dev stack'i yeniden başlatın."
    ;;
  *)
    echo "kullanım: preview-deploy.sh up|down" >&2
    exit 1
    ;;
esac
