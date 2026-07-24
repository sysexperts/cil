"use client";

import { useActionState } from "react";
import { lieferantSpeichern, sonderpreisSpeichern } from "./actions";

export function LieferantFormular() {
  const [state, action, pending] = useActionState(lieferantSpeichern, { ok: false, error: "" });
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Neuer Lieferant</h3>
      {state.ok && <div className="flash ok">Gespeichert.</div>}
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="form-row">
          <div className="field"><label>Name *</label><input name="name" required /></div>
          <div className="field"><label>USt-IdNr.</label><input name="ustIdNr" placeholder="DE…" /></div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Speichern…" : "Anlegen"}</button>
      </form>
    </div>
  );
}

export function SonderpreisFormular({ lieferanten }: { lieferanten: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(sonderpreisSpeichern, { ok: false, error: "" });
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Sonderpreis anlegen</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
        Gilt vorrangig vor dem Stammdaten-Preis (Preis-Hierarchie in der Prüfung).
      </p>
      {state.ok && <div className="flash ok">Sonderpreis gespeichert.</div>}
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="form-row">
          <div className="field"><label>Artikelnummer *</label><input name="artikelnummer" required /></div>
          <div className="field"><label>Preis netto *</label><input name="preisNetto" inputMode="decimal" required /></div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Lieferant (optional)</label>
            <select name="lieferantId">
              <option value="">— alle —</option>
              {lieferanten.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Gültig von</label><input name="gueltigVon" type="date" /></div>
          <div className="field"><label>Gültig bis</label><input name="gueltigBis" type="date" /></div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Speichern…" : "Sonderpreis speichern"}</button>
      </form>
    </div>
  );
}
