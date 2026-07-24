"use client";

import { useActionState } from "react";
import { produkteImportieren } from "./actions";

export default function ImportFormular({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(produkteImportieren, { ok: false, imported: 0, error: "" });

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Produkte importieren (CSV / Excel)</h3>
      <p className="muted" style={{ fontSize: 13 }}>
        Erwartete Spalten (Header): <code>artikelnummer, ean, name, kategorie, marke, einheit,
        gebinde, gewicht_kg, preis_netto, mwst, toleranz</code>. Vorhandene Artikelnummern werden
        aktualisiert (Upsert).
      </p>
      {state.imported > 0 && <div className="flash ok">{state.imported} Produkte importiert.</div>}
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="field">
          <input type="file" name="datei" accept=".csv,.xlsx,.xls,.tsv" required />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Importiere…" : "Importieren"}
          </button>
          <button className="btn" type="button" onClick={onClose}>Schließen</button>
        </div>
      </form>
    </div>
  );
}
