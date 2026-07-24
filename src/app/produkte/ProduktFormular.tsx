"use client";

import { useActionState, useState } from "react";
import { produktSpeichern } from "./actions";

type Produkt = {
  id: string;
  artikelnummer: string;
  ean: string | null;
  name: string;
  kategorie: string | null;
  marke: string | null;
  einheit: string;
  gebindeGroesse: string | null;
  gewichtKg: string | null;
  sollPreisNetto: string;
  mwstSatz: string;
  preisToleranz: string;
  aktiv: boolean;
};

export default function ProduktFormular({ produkt, onClose }: { produkt?: Produkt; onClose: () => void }) {
  const [state, action, pending] = useActionState(produktSpeichern, { ok: false, error: "" });
  const [done, setDone] = useState(false);

  if (state.ok && !done) {
    setDone(true);
    onClose();
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>{produkt ? "Produkt bearbeiten" : "Neues Produkt"}</h3>
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        {produkt && <input type="hidden" name="id" value={produkt.id} />}
        <div className="form-row">
          <div className="field">
            <label>Artikelnummer *</label>
            <input name="artikelnummer" defaultValue={produkt?.artikelnummer} required />
          </div>
          <div className="field">
            <label>EAN / GTIN</label>
            <input name="ean" defaultValue={produkt?.ean ?? ""} />
          </div>
        </div>
        <div className="field">
          <label>Bezeichnung *</label>
          <input name="name" defaultValue={produkt?.name} required />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Kategorie</label>
            <input name="kategorie" defaultValue={produkt?.kategorie ?? ""} />
          </div>
          <div className="field">
            <label>Marke</label>
            <input name="marke" defaultValue={produkt?.marke ?? ""} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Einheit</label>
            <input name="einheit" defaultValue={produkt?.einheit ?? "Stk"} placeholder="Stk, kg, Karton" />
          </div>
          <div className="field">
            <label>Gebinde / Größe</label>
            <input name="gebindeGroesse" defaultValue={produkt?.gebindeGroesse ?? ""} placeholder="z.B. 12x500g" />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Gewicht (kg)</label>
            <input name="gewichtKg" defaultValue={produkt?.gewichtKg ?? ""} inputMode="decimal" />
          </div>
          <div className="field">
            <label>Soll-Preis netto (EUR) *</label>
            <input name="sollPreisNetto" defaultValue={produkt?.sollPreisNetto} inputMode="decimal" required />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>MwSt-Satz (%)</label>
            <input name="mwstSatz" defaultValue={produkt?.mwstSatz ?? "7"} inputMode="decimal" />
          </div>
          <div className="field">
            <label>Preis-Toleranz (%)</label>
            <input name="preisToleranz" defaultValue={produkt?.preisToleranz ?? "0"} inputMode="decimal" />
          </div>
        </div>
        <div className="field">
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="aktiv" defaultChecked={produkt?.aktiv ?? true} style={{ width: "auto" }} /> Aktiv
          </label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Speichern…" : "Speichern"}
          </button>
          <button className="btn" type="button" onClick={onClose}>Abbrechen</button>
        </div>
      </form>
    </div>
  );
}
