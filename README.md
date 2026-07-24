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

## Status
- [x] Phase 0 — Projektbasis, Design-System, DB-Schema
- [x] Phase 1 — Produktverwaltung (Liste, manuelle Pflege, CSV/Excel-Import)
- [ ] Phase 2 — Rechnungs-Upload (PDF) + Positionsextraktion
- [ ] Phase 3 — Prüf-Engine (Preis/Menge/Kilo/Formal)
- [ ] Phase 4 — Freigabe-Workflow + Team-Login
- [ ] Phase 5 — OCR, ZUGFeRD/XRechnung, E-Mail-Ingest
- [ ] Phase 6 — Report/Export + Benachrichtigungen
- [ ] Phase 7 — Security-Härtung, DSGVO/GoBD, Backups
