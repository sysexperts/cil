#!/usr/bin/env bash
# Ruft den IMAP-Abhol-Job auf (isolierter Container). No-Op, solange IMAP in den
# Einstellungen nicht aktiviert ist. Per Cron alle 10 Minuten.
set -euo pipefail
cd /opt/ciloglu
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
$COMPOSE run --rm -v /opt/ciloglu/scripts:/app/scripts --entrypoint sh migrate \
  -c "npx tsx scripts/mail-abholen.ts"
