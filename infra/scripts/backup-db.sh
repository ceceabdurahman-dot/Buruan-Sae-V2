#!/usr/bin/env bash
# ============================================================
# backup-db.sh — Backup otomatis PostgreSQL Buruan Sae 2.0
# Dijalankan via cron: 0 2 * * * bash /opt/buruan-sae/scripts/backup-db.sh
# ============================================================

set -euo pipefail

# ── Konfigurasi ───────────────────────────────────────────────
APP_DIR="${APP_DIR:-/opt/buruan-sae}"
BACKUP_DIR="${APP_DIR}/backups"
DB_CONTAINER="${DB_CONTAINER:-buruan-sae-postgres-1}"
DB_NAME="${POSTGRES_DB:-buruan_sae}"
DB_USER="${POSTGRES_USER:-buruan_sae}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/db_${DB_NAME}_${TIMESTAMP}.sql.gz"

# MinIO backup (opsional)
MINIO_CONTAINER="${MINIO_CONTAINER:-buruan-sae-minio-1}"
MINIO_BACKUP_BUCKET="${MINIO_BACKUP_BUCKET:-backups}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── Persiapan ─────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

log "Memulai backup database ${DB_NAME}..."

# ── 1. Dump PostgreSQL ────────────────────────────────────────
docker exec "${DB_CONTAINER}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-acl \
  --format=plain \
  | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "Backup selesai: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── 2. Verifikasi file backup ─────────────────────────────────
if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
  log "ERROR: File backup corrupt! Menghapus..."
  rm -f "${BACKUP_FILE}"
  exit 1
fi
log "Verifikasi checksum: OK"

# ── 3. Upload ke MinIO (jika tersedia) ────────────────────────
if docker ps --format '{{.Names}}' | grep -q "${MINIO_CONTAINER}"; then
  log "Mengupload ke MinIO bucket '${MINIO_BACKUP_BUCKET}'..."
  docker exec "${MINIO_CONTAINER}" mc alias set local \
    "http://localhost:9000" \
    "${MINIO_ROOT_USER:-minioadmin}" \
    "${MINIO_ROOT_PASSWORD:-minioadmin}" \
    --quiet 2>/dev/null || true

  docker cp "${BACKUP_FILE}" "${MINIO_CONTAINER}:/tmp/$(basename ${BACKUP_FILE})"
  docker exec "${MINIO_CONTAINER}" mc cp \
    "/tmp/$(basename ${BACKUP_FILE})" \
    "local/${MINIO_BACKUP_BUCKET}/$(basename ${BACKUP_FILE})" \
    --quiet && log "Upload MinIO: OK"
else
  log "MinIO container tidak ditemukan, skip upload."
fi

# ── 4. Hapus backup lama (retensi N hari) ─────────────────────
log "Membersihkan backup lebih dari ${RETENTION_DAYS} hari..."
DELETED=$(find "${BACKUP_DIR}" -name "db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "Dihapus: ${DELETED} file backup lama."

# ── 5. Cek ruang disk ─────────────────────────────────────────
DISK_USAGE=$(df -h "${BACKUP_DIR}" | awk 'NR==2 {print $5}' | tr -d '%')
if [[ ${DISK_USAGE} -gt 85 ]]; then
  log "WARNING: Penggunaan disk ${DISK_USAGE}% — segera tambah kapasitas!"
fi

# ── 6. Kirim notifikasi (opsional via webhook) ────────────────
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  curl -sS -X POST "${SLACK_WEBHOOK_URL}" \
    -H 'Content-type: application/json' \
    -d "{\"text\": \"✅ Backup Buruan Sae DB berhasil: \`$(basename ${BACKUP_FILE})\` (${BACKUP_SIZE}) — Disk: ${DISK_USAGE}%\"}" \
    > /dev/null 2>&1 || true
fi

log "Backup selesai. File: $(basename ${BACKUP_FILE})"
