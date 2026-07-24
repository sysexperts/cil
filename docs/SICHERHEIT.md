# Sicherheit & Compliance (DSGVO / GoBD)

**Projekt:** Ciloglu Rechnungseingangsprüfer

## 1. Grundsätze
- Serverstandort Deutschland/EU (Hosting auf eigenem Server).
- Datensparsamkeit: nur rechnungs-/prüfrelevante Daten.
- Alles über TLS (HTTPS), HTTP→HTTPS-Redirect via Nginx.

## 2. Authentifizierung & Sessions
- Team-Login mit E-Mail + Passwort, Passwörter als **bcrypt**-Hash.
- Session-Cookie: `httpOnly`, `Secure`, `SameSite=Lax`, begrenzte Lebensdauer.
- Rate-Limiting auf Login und Upload-Endpunkte.
- Rollen-Erweiterung (Admin/Prüfer/Buchhaltung) als spätere Ausbaustufe vorgesehen.

## 3. Datei-Uploads (Rechnungen)
- Whitelist erlaubter Typen: PDF, PNG/JPG (Scan), XML (E-Rechnung).
- Maximale Dateigröße konfigurierbar (Default 20 MB).
- Dateien liegen außerhalb des Web-Roots, Zugriff nur authentifiziert.
- Kein Ausführen/Rendern von hochgeladenem HTML/SVG; PDFs nur als Download/Vorschau.
- Virenscan-Hook vorgesehen (ClamAV, optional).

## 4. Eingabevalidierung
- Alle API-Eingaben mit **Zod** validiert (Server-seitig).
- Prisma (parametrisiert) → kein SQL-Injection-Risiko.
- Ausgabe-Encoding durch React → XSS-Schutz.

## 5. Secrets
- Ausschließlich in `.env` (nicht im Repo). `.env.example` als Vorlage.
- DB-Zugang, Mail-Zugang, Session-Secret niemals commiten.

## 6. Audit-Trail / GoBD
- Unveränderbares Log für: Rechnungseingang, Prüfung, Freigabe/Ablehnung, Export.
- Festhalten: wer, wann, welche Aktion, welche Werte (Vorher/Nachher).
- Originalrechnung unveränderlich archiviert (Unveränderbarkeit nach GoBD).
- Aufbewahrungsfrist: 10 Jahre (steuerrelevante Unterlagen).

## 7. Backups & Betrieb
- Tägliches DB-Backup + Datei-Backup, verschlüsselt, getrennt gelagert.
- Restore-Test dokumentiert.
- Monitoring/Health-Check-Endpunkt.

## 8. Datenschutz (DSGVO)
- Verarbeitungsverzeichnis-Bausteine dokumentieren (Auftragsverarbeitung Hosting).
- Löschkonzept nach Ablauf der Aufbewahrungsfrist.
- Zugriffsprotokollierung.
