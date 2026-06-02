#!/usr/bin/env bash
# ============================================================
# setup-prod.sh — Inisialisasi Server Produksi Buruan Sae 2.0
# Dijalankan satu kali saat pertama kali deploy ke server baru
# Usage: sudo bash setup-prod.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Prasyarat ──────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Jalankan sebagai root: sudo bash $0"
[[ -f ".env.production" ]] || error "File .env.production tidak ditemukan di direktori ini"

info "Memulai setup server produksi Buruan Sae 2.0..."
source .env.production

# ── 1. Update sistem ──────────────────────────────────────────
info "Update paket sistem..."
apt-get update -q && apt-get upgrade -y -q
apt-get install -y -q \
  curl wget git unzip \
  ca-certificates gnupg \
  ufw fail2ban \
  htop iotop \
  postgresql-client \
  jq

success "Paket sistem terinstal."

# ── 2. Docker Engine ──────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Menginstal Docker Engine..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  usermod -aG docker "${SUDO_USER:-ubuntu}"
  success "Docker Engine terinstal."
else
  warn "Docker sudah terinstal, skip."
fi

# ── 3. Konfigurasi Firewall (UFW) ─────────────────────────────
info "Mengkonfigurasi firewall UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# Internal Docker network (tidak expose keluar)
ufw allow from 172.16.0.0/12 comment 'Docker internal'
ufw --force enable
success "Firewall dikonfigurasi."

# ── 4. Fail2Ban ───────────────────────────────────────────────
info "Mengkonfigurasi Fail2Ban..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
action   = iptables-multiport[name=nginx-limit-req, port="http,https"]
logpath  = /var/log/nginx/error.log
findtime = 600
bantime  = 7200
maxretry = 10
EOF
systemctl enable --now fail2ban
success "Fail2Ban dikonfigurasi."

# ── 5. Swap (jika RAM < 2GB) ──────────────────────────────────
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ $TOTAL_RAM_MB -lt 2048 ]] && [[ ! -f /swapfile ]]; then
  info "RAM < 2GB, membuat swapfile 2GB..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  success "Swapfile 2GB aktif."
fi

# ── 6. Direktori aplikasi ─────────────────────────────────────
info "Membuat struktur direktori..."
APP_DIR="${APP_DIR:-/opt/buruan-sae}"
mkdir -p "${APP_DIR}"/{data/{postgres,redis,minio},logs/{nginx,backend},ssl,backups}
chmod 700 "${APP_DIR}/ssl"
success "Direktori aplikasi dibuat di ${APP_DIR}."

# ── 7. SSL Certificate (Let's Encrypt) ───────────────────────
if [[ -n "${DOMAIN:-}" && ! -f "${APP_DIR}/ssl/fullchain.pem" ]]; then
  info "Mendapatkan SSL certificate untuk ${DOMAIN}..."
  apt-get install -y -q certbot
  certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "${SSL_EMAIL:-admin@${DOMAIN}}" \
    -d "${DOMAIN}" \
    -d "api.${DOMAIN}"

  # Copy ke direktori app
  cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem "${APP_DIR}/ssl/"
  cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem "${APP_DIR}/ssl/"
  chmod 644 "${APP_DIR}/ssl/"*.pem

  # Renewal cron
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/${DOMAIN}/*.pem ${APP_DIR}/ssl/ && docker compose -f ${APP_DIR}/docker-compose.prod.yml exec nginx nginx -s reload") | crontab -
  success "SSL certificate aktif untuk ${DOMAIN}."
else
  warn "SSL: domain tidak diset atau sertifikat sudah ada. Skip."
fi

# ── 8. Docker network ─────────────────────────────────────────
info "Membuat Docker network..."
docker network create buruan-sae-network 2>/dev/null || warn "Network sudah ada."

# ── 9. Pull images awal ───────────────────────────────────────
info "Pulling Docker images dasar..."
docker pull postgis/postgis:15-3.4-alpine
docker pull redis:7-alpine
docker pull minio/minio:latest
docker pull nginx:alpine

# ── 10. Setup cron backup ─────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/backup-db.sh" ]]; then
  chmod +x "${SCRIPT_DIR}/backup-db.sh"
  (crontab -l 2>/dev/null; echo "0 2 * * * bash ${SCRIPT_DIR}/backup-db.sh >> ${APP_DIR}/logs/backup.log 2>&1") | crontab -
  success "Cron backup database terjadwal (setiap hari jam 02:00)."
fi

# ── 11. Kernel hardening ─────────────────────────────────────
info "Menerapkan kernel hardening..."
cat >> /etc/sysctl.conf <<'EOF'

# Buruan Sae 2.0 — Kernel Hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
fs.file-max = 1000000
EOF
sysctl -p > /dev/null 2>&1

# Increase ulimits
cat >> /etc/security/limits.conf <<'EOF'
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
EOF

success "Kernel hardening diterapkan."

# ── Selesai ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Setup server Buruan Sae 2.0 SELESAI!           ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "  Langkah selanjutnya:"
echo "  1. Salin file .env.production ke ${APP_DIR}/"
echo "  2. Jalankan: docker compose -f docker-compose.prod.yml up -d"
echo "  3. Jalankan migrasi: docker compose exec backend npx prisma migrate deploy"
echo "  4. Jalankan seed: docker compose exec backend npm run seed"
echo ""
echo "  Log: ${APP_DIR}/logs/"
echo "  SSL: ${APP_DIR}/ssl/"
echo "  Backup: ${APP_DIR}/backups/"
echo ""
warn "Logout dan login kembali agar perubahan group Docker berlaku."
