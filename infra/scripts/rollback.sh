#!/usr/bin/env bash
# ============================================================
# rollback.sh — Rollback deploy Buruan Sae 2.0 ke versi sebelumnya
# Usage: bash rollback.sh [IMAGE_TAG]
# Contoh: bash rollback.sh 2.0.1
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

APP_DIR="${APP_DIR:-/opt/buruan-sae}"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
REGISTRY="${REGISTRY:-ghcr.io/ibbf/buruan-sae}"

TARGET_TAG="${1:-}"

# ── Cek tag yang tersedia ──────────────────────────────────────
if [[ -z "${TARGET_TAG}" ]]; then
  warn "Tag tidak disebutkan. Menampilkan 5 image terakhir..."
  docker images "${REGISTRY}/backend" --format "{{.Tag}}\t{{.CreatedAt}}" | head -5
  echo ""
  read -rp "Masukkan tag untuk rollback: " TARGET_TAG
fi

info "Rollback ke tag: ${TARGET_TAG}"

# ── Konfirmasi ─────────────────────────────────────────────────
read -rp "⚠️  Lanjutkan rollback ke ${TARGET_TAG}? (y/N) " CONFIRM
[[ "${CONFIRM}" =~ ^[Yy]$ ]] || { warn "Rollback dibatalkan."; exit 0; }

# ── 1. Update image tag di compose ────────────────────────────
info "Mengubah image tag ke ${TARGET_TAG}..."
sed -i "s|${REGISTRY}/backend:.*|${REGISTRY}/backend:${TARGET_TAG}|g" "${COMPOSE_FILE}"
sed -i "s|${REGISTRY}/web-admin:.*|${REGISTRY}/web-admin:${TARGET_TAG}|g" "${COMPOSE_FILE}"

# ── 2. Pull image target ──────────────────────────────────────
info "Pulling image ${TARGET_TAG}..."
docker pull "${REGISTRY}/backend:${TARGET_TAG}"
docker pull "${REGISTRY}/web-admin:${TARGET_TAG}"

# ── 3. Simpan state sebelum rollback ──────────────────────────
ROLLBACK_LOG="${APP_DIR}/logs/rollback_$(date '+%Y%m%d_%H%M%S').log"
docker compose -f "${COMPOSE_FILE}" ps > "${ROLLBACK_LOG}" 2>&1
info "State sebelum rollback disimpan di: ${ROLLBACK_LOG}"

# ── 4. Jalankan rollback ──────────────────────────────────────
info "Menjalankan rollback container..."
docker compose -f "${COMPOSE_FILE}" up -d --no-deps --no-build backend web-admin

# ── 5. Health check ───────────────────────────────────────────
info "Menunggu backend sehat..."
for i in {1..30}; do
  if curl -sf "http://localhost:3001/health/ready" > /dev/null 2>&1; then
    info "Backend sehat setelah ${i}s"
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then
    error "Backend tidak sehat setelah 60 detik! Periksa log: docker compose logs backend"
  fi
done

# ── 6. Bersihkan image lama ───────────────────────────────────
info "Membersihkan image yang tidak terpakai..."
docker image prune -f > /dev/null 2>&1

echo ""
echo -e "${GREEN}✅ Rollback ke ${TARGET_TAG} BERHASIL!${NC}"
echo ""
docker compose -f "${COMPOSE_FILE}" ps
