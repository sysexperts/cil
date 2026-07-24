#!/usr/bin/env bash
# Tägliches Backup: PostgreSQL-Dump + hochgeladene Rechnungen (Storage).
# Aufbewahrung: 14 Tage. Aufruf per Cron (siehe deploy/README-DEPLOY.md).
set -euo pipefail

PROJ="/opt/ciloglu"
BACKUP_DIR="$PROJ/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
cd "$PROJ"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# 1) Datenbank-Dump (komprimiert)
$COMPOSE exec -T db pg_dump -U ciloglu ciloglu_rechnungen | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

# 2) Storage (Original-Rechnungen) sichern, falls vorhanden
if docker volume inspect ciloglu_storage_data >/dev/null 2>&1; then
  docker run --rm -v ciloglu_storage_data:/data -v "$BACKUP_DIR:/backup" alpine \
    tar czf "/backup/storage-$STAMP.tar.gz" -C /data . || true
fi

# 3) Alte Backups aufräumen
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "storage-*.tar.gz" -mtime +$KEEP_DAYS -delete

echo "Backup fertig: $BACKUP_DIR (db-$STAMP.sql.gz)"
