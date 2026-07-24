# Ciloglu Rechnungseingangsprüfer — Projektplan

**Kunde:** Ciloglu Handels GmbH (ciloglu.de)
**Repository:** https://github.com/sysexperts/cil
**Produktiv-Domain:** https://ciloglu.vapur-it.de
**Stand:** 2026-07-24

---

## 1. Ziel & Kernfunktion

Ein Web-Tool, das eingehende Lieferantenrechnungen **automatisch auf Richtigkeit prüft**.
Kern: Abgleich jeder Rechnungsposition gegen die hinterlegten **Stammdaten**
(Artikelnummer, Preis, Menge, Kilo/Größe). Abweichungen werden erkannt, markiert,
zur Freigabe geführt, exportiert und ggf. gemeldet.

## 2. Umfang (mit Kunde abgestimmt)

**Rechnungseingang (alle Kanäle):**
- PDF-Upload (digital, mit Textebene)
- Gescannte PDFs / Fotos (OCR)
- ZUGFeRD / XRechnung (strukturiertes XML)
- E-Mail-Eingang (automatischer Abruf)

**Stammdaten-Quelle:**
- CSV-/Excel-Import **und** manuelle Pflege in der Weboberfläche

**Bei Abweichung:**
- Anzeigen/Markieren
- Freigabe-Workflow (Status + Historie)
- Report/Export (PDF/Excel)
- Benachrichtigung (E-Mail/Alert)

**Zugang:** Einfaches Team-Login (ein Team, ohne Rollen — später erweiterbar).

## 3. Tech-Stack (Begründung)

Ein einziger Runtime für einfache Wartung auf dem eigenen Server:

| Bereich | Technologie |
|--------|-------------|
| Frontend + Backend | Next.js 15 (React, TypeScript, App Router) |
| Datenbank | PostgreSQL 16 + Prisma ORM |
| PDF-Text | `pdf-parse` |
| OCR | Tesseract (`tesseract.js` / System-Tesseract) |
| E-Rechnung | XML-Parser (ZUGFeRD/Factur-X, XRechnung/UBL & CII) |
| Auth | Session-Login (bcrypt, httpOnly-Cookie) |
| Deployment | Docker + docker-compose, Nginx-Reverse-Proxy |
| CI | GitHub Actions (Lint, Typecheck, Test, Build) |

## 4. Design

Angelehnt an ciloglu.de:
- **Markenfarbe:** `#ec602a` (Orange)
- Neutral: `#222` Text, `#666` sekundär, `#e6e6e6` Linien, `#f3f3f3` Flächen, `#fff` Grund
- Schrift: **Ubuntu** (Headlines), Open Sans/System (Fließtext)
- Logo: https://ciloglu.de/dcms-themes/site/assets/dist/img/ciloglu.png
- Sachlich, produktorientiert, B2B.

## 5. Prüf-Logik (Kern)

Pro Rechnungsposition wird geprüft:
1. **Artikel-Match** — Artikelnummer/EAN → Stammartikel gefunden?
2. **Preis** — Rechnungspreis vs. Soll-Preis (mit Toleranz, Preis-Hierarchie:
   Sonderpreis > Jahresvereinbarung > Stammdaten-Preis)
3. **Menge/Einheit** — Menge & Einheit plausibel?
4. **Kilo/Größe** — Gewicht/Gebindegröße stimmt mit Stammartikel überein?
5. **Positions-Summe** — Menge × Einzelpreis = Positionsbetrag (Rechenprüfung)

Rechnungskopf:
6. **Formalprüfung §14 UStG** — Pflichtangaben vorhanden (Steuernr./USt-IdNr.,
   Rechnungsnr., Datum, Leistungsbeschreibung, Steuersatz/-betrag)
7. **Summen** — Netto + MwSt = Brutto, Zwischensummen konsistent

**Ergebnis-Ampel:** grün (alles ok, ggf. Auto-Freigabe) · gelb (Abweichung
innerhalb Toleranz) · rot (Abweichung/fehlend → Eskalation).

## 6. Phasenplan

| Phase | Inhalt |
|------|--------|
| 0 | Repo, CI, Docker, Design-System, DB-Grundschema |
| 1 | Stammdaten: Produktverwaltung (Liste, manuelle Pflege, CSV/Excel-Import) |
| 2 | Rechnungs-Upload (PDF digital) + Parsing + Positionsextraktion |
| 3 | Prüf-Engine (Preis/Menge/Kilo/Formal), Abweichungen markieren |
| 4 | Freigabe-Workflow + Team-Login |
| 5 | OCR, ZUGFeRD/XRechnung, E-Mail-Ingest |
| 6 | Report/Export (PDF/Excel) + Benachrichtigungen |
| 7 | Security-Härtung, DSGVO/GoBD, Backups, Doku |

## 7. Datenmodell (Kern, wächst mit Phasen)

- **Produkt** (Stammartikel): artikelnummer, ean, name, kategorie, marke,
  einheit, gebindeGroesse, gewichtKg, sollPreisNetto, waehrung, mwstSatz, aktiv
- **Sonderpreis**: produkt, lieferant, preis, gueltigVon, gueltigBis
- **Lieferant**: name, ustIdNr, ...
- **Rechnung**: nummer, datum, lieferant, nettoSumme, mwstSumme, bruttoSumme,
  quelle (PDF/OCR/ZUGFeRD/XRECHNUNG/MAIL), status, originalDatei
- **Rechnungsposition**: rechnung, artikelnummer, bezeichnung, menge, einheit,
  einzelpreis, positionsbetrag, matchedProduktId, pruefStatus, abweichungen[]
- **Pruefergebnis / AuditLog**: wer, wann, was (GoBD-Nachvollziehbarkeit)
- **User**: email, passwortHash

## 8. Sicherheit & Compliance

Siehe [SICHERHEIT.md](./SICHERHEIT.md). Kurz:
- Serverstandort DE/EU, TLS, verschlüsselte Ablage der Originaldateien
- Secrets ausschließlich in ENV, nie im Repo
- Input-Validierung (Zod), Datei-Uploads gesichert (Typ/Größe, kein Ausführen)
- Audit-Trail für alle prüf-/freigaberelevanten Aktionen (GoBD)
- Aufbewahrung 10 Jahre (steuerrelevant), Backup-Konzept
- Rate-Limiting, sichere Sessions (httpOnly, SameSite, bcrypt)
