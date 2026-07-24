# Ciloglu Rechnungseingangsprüfer

Web-Tool zur automatischen Prüfung eingehender Lieferantenrechnungen für die
**Ciloglu Handels GmbH**. Rechnungspositionen werden gegen die hinterlegten
Produkt-Stammdaten (Artikelnummer, Preis, Menge, Kilo/Größe) abgeglichen;
Abweichungen werden erkannt, markiert und zur Freigabe geführt.

- **Doku:** [docs/PROJEKTPLAN.md](docs/PROJEKTPLAN.md) · [docs/SICHERHEIT.md](docs/SICHERHEIT.md)
- **Stack:** Next.js 15 (TS) · PostgreSQL + Prisma · Docker
- **Produktiv:** https://ciloglu.vapur-it.de

## Entwicklung (lokal)

```bash
cp .env.example .env          # Werte anpassen (DATABASE_URL, SESSION_SECRET)
npm install
docker compose up -d db       # PostgreSQL starten
npx prisma migrate dev        # Datenbank-Schema anlegen
npm run db:seed               # Demo-Daten (optional)
npm run dev                   # http://localhost:3000
```

## Deployment (Server, Docker)

```bash
cp .env.example .env          # Produktionswerte setzen
docker compose up -d --build  # DB + App
docker compose exec app npx prisma migrate deploy
```

Nginx als Reverse-Proxy auf Port 3000, TLS für `ciloglu.vapur-it.de`.

## Deployment-Status
**Live:** https://ciloglu.vapur-it.de (Server `/opt/ciloglu`, App-Container `127.0.0.1:3200`,
Nginx-Reverse-Proxy + Let's-Encrypt-TLS). Update auf dem Server:

```bash
cd /opt/ciloglu
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate  # bei Schemaänderung
```

## Status
- [x] Phase 0 — Projektbasis, Design-System, DB-Schema
- [x] Phase 1 — Produktverwaltung (Liste, manuelle Pflege, CSV/Excel-Import)
- [x] **Live-Deployment** auf ciloglu.vapur-it.de (Docker + Nginx + TLS)
- [x] Phase 2 — Rechnungs-Upload (PDF) + Positionsextraktion (unpdf)
- [x] Phase 3 — Prüf-Engine (Preis/Menge/Kilo/Formal, Ampel) + 30 Unit-Tests
- [x] Phase 4 — Team-Login (JWT), Freigabe-Workflow, Audit-Trail, Konto-Verwaltung
- [x] Phase 5 — ZUGFeRD/XRechnung (CII+UBL) · *offen: OCR, E-Mail-Ingest*
- [x] Phase 6 — CSV-Export (Liste + Einzelrechnung) · *offen: PDF-Report, E-Mail-Benachrichtigung*
- [x] Phase 7 — Backups (DB+Storage, Cron), Sicherheits-/Betriebsdoku · *offen: Virenscan, Rollen*

Details & offene Punkte: [docs/PROJEKTPLAN.md](docs/PROJEKTPLAN.md) · [deploy/README-DEPLOY.md](deploy/README-DEPLOY.md)
