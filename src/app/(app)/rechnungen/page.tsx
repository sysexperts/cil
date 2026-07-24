export const dynamic = "force-dynamic";

export default function RechnungenSeite() {
  return (
    <div>
      <div className="topbar"><h1>Rechnungen</h1></div>
      <div className="card card-pad">
        <p className="muted">
          Rechnungs-Upload und automatische Prüfung folgen in Phase 2–3
          (PDF-Import, Positionsextraktion, Abgleich gegen die Produkt-Stammdaten).
        </p>
      </div>
    </div>
  );
}
