# Deployment & Betrieb — Ciloglu Rechnungsprüfer

## Server
- Host: `185.248.140.225` (SSH-Alias `vapur-server`, User root)
- Domain: https://ciloglu.vapur-it.de (Let's-Encrypt-TLS, Auto-Renew)
- Projektpfad: `/opt/ciloglu`
- App-Container: `127.0.0.1:3200` (Nginx-Reverse-Proxy davor), PostgreSQL nur intern

## Update deployen
Vom Entwicklungsrechner (Quellcode wird per tar/SSH übertragen, Repo ist privat):

```bash
# lokal im Projektordner
ssh vapur-server 'find /opt/ciloglu -mindepth 1 -maxdepth 1 ! -name .env ! -name storage ! -name backups -exec rm -rf {} +'
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=storage -czf - . \
  | ssh vapur-server 'tar --no-same-owner -xzf - -C /opt/ciloglu'
ssh vapur-server 'cd /opt/ciloglu && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app'
```

Bei Schemaänderung zusätzlich:
```bash
ssh vapur-server 'cd /opt/ciloglu && docker compose -f docker-compose.yml -f docker-compose.prod.yml build migrate \
  && docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate'
```

## Nginx
Vhost: `deploy/nginx/ciloglu.vapur-it.de.conf` → `/etc/nginx/sites-available/ciloglu.vapur-it.de`.
Nach Änderung: `nginx -t && systemctl reload nginx`.

## Backups
Skript `deploy/backup.sh` nach `/opt/ciloglu/deploy/backup.sh`. Täglicher Cron (03:30):

```bash
chmod +x /opt/ciloglu/deploy/backup.sh
( crontab -l 2>/dev/null; echo "30 3 * * * /opt/ciloglu/deploy/backup.sh >> /var/log/ciloglu-backup.log 2>&1" ) | crontab -
```

Restore DB:
```bash
gunzip -c /opt/ciloglu/backups/db-<STAMP>.sql.gz | \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U ciloglu -d ciloglu_rechnungen
```

## Health
`https://ciloglu.vapur-it.de/api/health` → `{"status":"ok","db":"up"}` (hinter Login erreichbar; intern via `curl 127.0.0.1:3200/api/health`).
