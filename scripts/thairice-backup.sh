#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ThaiRice Server Backup Script
# Usage: /data/backup/thairice-backup.sh [custom_backup_dir]
# ==============================================================================

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_ROOT="${1:-/data/backup/thairice-${TIMESTAMP}}"
API_DIR="/data/api/thairice"
HTML_DIR="/data/html/thairice"
DB_CONTAINER="seniorproject-db"
DB_USER="postgres"
DB_NAME="seniorproject"

echo "=================================================="
echo " Starting ThaiRice Backup: ${TIMESTAMP}"
echo " Target Directory: ${BACKUP_ROOT}"
echo "=================================================="

mkdir -p "${BACKUP_ROOT}"

# Determine docker command (use sudo if current user cannot access docker.sock directly)
DOCKER_CMD="docker"
if ! docker ps >/dev/null 2>&1; then
  DOCKER_CMD="sudo docker"
fi

# 1. Backup PostgreSQL Database
echo "[1/3] Backing up PostgreSQL database (${DB_NAME})..."
if command -v pg_dump >/dev/null 2>&1; then
  PGPASSWORD=postgres pg_dump -h localhost -p 5432 -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip -c > "${BACKUP_ROOT}/thairice_db.sql.gz"
else
  ${DOCKER_CMD} exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip -c > "${BACKUP_ROOT}/thairice_db.sql.gz"
fi
echo "  -> Saved: ${BACKUP_ROOT}/thairice_db.sql.gz ($(du -h "${BACKUP_ROOT}/thairice_db.sql.gz" | cut -f1))"

# 2. Backup API + Genomes + .env (excluding node_modules to save space/time)
echo "[2/3] Backing up /data/api/thairice (code, .env, genomes, outputs)..."
tar --exclude='node_modules' -czf "${BACKUP_ROOT}/thairice_api.tar.gz" -C /data/api thairice
echo "  -> Saved: ${BACKUP_ROOT}/thairice_api.tar.gz ($(du -h "${BACKUP_ROOT}/thairice_api.tar.gz" | cut -f1))"

# 3. Backup Frontend HTML (/data/html/thairice)
echo "[3/3] Backing up /data/html/thairice (frontend static files)..."
tar -czf "${BACKUP_ROOT}/thairice_html.tar.gz" -C /data/html thairice
echo "  -> Saved: ${BACKUP_ROOT}/thairice_html.tar.gz ($(du -h "${BACKUP_ROOT}/thairice_html.tar.gz" | cut -f1))"

echo "=================================================="
echo " Backup Completed Successfully!"
echo " Location: ${BACKUP_ROOT}"
ls -lh "${BACKUP_ROOT}"
echo "=================================================="
