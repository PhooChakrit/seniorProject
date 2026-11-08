#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ThaiRice Server Restore Script
# Usage: /data/backup/thairice-restore.sh /data/backup/thairice-YYYY-MM-DD_HHMMSS
# ==============================================================================

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_folder_path>"
  echo "Available backups in /data/backup:"
  ls -1d /data/backup/thairice-* 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_DIR="${1%/}"
DB_DUMP="${BACKUP_DIR}/thairice_db.sql.gz"
API_TAR="${BACKUP_DIR}/thairice_api.tar.gz"
HTML_TAR="${BACKUP_DIR}/thairice_html.tar.gz"
DB_CONTAINER="seniorproject-db"
DB_USER="postgres"
DB_NAME="seniorproject"

if [ ! -d "${BACKUP_DIR}" ]; then
  echo "Error: Backup directory not found: ${BACKUP_DIR}" >&2
  exit 1
fi

echo "=================================================="
echo " Restoring ThaiRice from: ${BACKUP_DIR}"
echo "=================================================="

DOCKER_CMD="docker"
if ! docker ps >/dev/null 2>&1; then
  DOCKER_CMD="sudo docker"
fi

# 1. Restore PostgreSQL Database
if [ -f "${DB_DUMP}" ]; then
  echo "[1/3] Restoring PostgreSQL database from ${DB_DUMP}..."
  if command -v psql >/dev/null 2>&1; then
    gunzip -c "${DB_DUMP}" | PGPASSWORD=postgres psql -h localhost -p 5432 -U "${DB_USER}" -d "${DB_NAME}"
  else
    gunzip -c "${DB_DUMP}" | ${DOCKER_CMD} exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"
  fi
  echo "  -> Database restored."
else
  echo "[WARN] ${DB_DUMP} not found, skipping database restore."
fi

# 2. Restore /data/api/thairice
if [ -f "${API_TAR}" ]; then
  echo "[2/3] Restoring /data/api/thairice from ${API_TAR}..."
  tar -xzf "${API_TAR}" -C /data/api
  echo "  -> /data/api/thairice restored."
else
  echo "[WARN] ${API_TAR} not found, skipping API restore."
fi

# 3. Restore /data/html/thairice
if [ -f "${HTML_TAR}" ]; then
  echo "[3/3] Restoring /data/html/thairice from ${HTML_TAR}..."
  tar -xzf "${HTML_TAR}" -C /data/html
  echo "  -> /data/html/thairice restored."
else
  echo "[WARN] ${HTML_TAR} not found, skipping HTML restore."
fi

echo "=================================================="
echo " Restore Completed!"
echo " Note: If code or worker config changed, restart services with:"
echo "   sudo systemctl restart thairice-api"
echo "   sudo docker restart seniorproject-worker"
echo "=================================================="
