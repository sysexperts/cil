"use client";

import { useState } from "react";
import ProduktFormular from "./ProduktFormular";
import ImportFormular from "./ImportFormular";
import { produktLoeschen } from "./actions";

export type ProduktRow = {
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

export default function ProduktListe({ produkte }: { produkte: ProduktRow[] }) {
  const [modus, setModus] = useState<"none" | "neu" | "import">("none");
  const [editId, setEditId] = useState<string | null>(null);
  const [suche, setSuche] = useState("");

  const gefiltert = produkte.filter((p) => {
    const q = suche.trim().toLowerCase();
    if (!q) return true;
    return [p.artikelnummer, p.name, p.kategorie, p.marke, p.ean]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const edit = editId ? produkte.find((p) => p.id === editId) : undefined;

  return (
    <div>
      <div className="toolbar">
        <input
          placeholder="Suchen: Artikelnr, Name, Kategorie, Marke…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          style={{ maxWidth: 360, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => { setModus("import"); setEditId(null); }}>⬆ Import</button>
          <button className="btn btn-primary" onClick={() => { setModus("neu"); setEditId(null); }}>+ Neues Produkt</button>
        </div>
      </div>

      {modus === "import" && <ImportFormular onClose={() => setModus("none")} />}
      {modus === "neu" && !editId && <ProduktFormular onClose={() => setModus("none")} />}
      {edit && <ProduktFormular produkt={edit} onClose={() => setEditId(null)} />}

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Artikelnr.</th>
              <th>Bezeichnung</th>
              <th>Kategorie</th>
              <th>Gebinde</th>
              <th className="num">Gewicht (kg)</th>
              <th className="num">Preis netto</th>
              <th className="num">MwSt</th>
              <th className="num">Tol.</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.length === 0 && (
              <tr><td colSpan={10}><div className="empty">Keine Produkte gefunden.</div></td></tr>
            )}
            {gefiltert.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.artikelnummer}</strong>{p.ean && <div className="muted" style={{ fontSize: 12 }}>{p.ean}</div>}</td>
                <td>{p.name}{p.marke && <div className="muted" style={{ fontSize: 12 }}>{p.marke}</div>}</td>
                <td>{p.kategorie ?? "—"}</td>
                <td>{p.gebindeGroesse ?? "—"} <span className="muted">/ {p.einheit}</span></td>
                <td className="num">{p.gewichtKg ?? "—"}</td>
                <td className="num">{Number(p.sollPreisNetto).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                <td className="num">{Number(p.mwstSatz)}%</td>
                <td className="num">{Number(p.preisToleranz)}%</td>
                <td>{p.aktiv ? <span className="badge gruen">aktiv</span> : <span className="badge neutral">inaktiv</span>}</td>
                <td className="right">
                  <button className="btn btn-sm" onClick={() => { setEditId(p.id); setModus("none"); }}>Bearbeiten</button>{" "}
                  <form action={produktLoeschen} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn-sm" type="submit"
                      onClick={(e) => { if (!confirm("Produkt löschen?")) e.preventDefault(); }}>Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>{gefiltert.length} von {produkte.length} Produkten</p>
    </div>
  );
}
