import { prisma } from "@/lib/db";
import { LieferantFormular, SonderpreisFormular } from "./Formulare";
import { lieferantLoeschen, sonderpreisLoeschen } from "./actions";

export const dynamic = "force-dynamic";

function d(x: Date | null): string {
  return x ? new Date(x).toLocaleDateString("de-DE") : "—";
}

export default async function LieferantenSeite() {
  let lieferanten: any[] = [];
  let sonderpreise: any[] = [];
  try {
    [lieferanten, sonderpreise] = await Promise.all([
      prisma.lieferant.findMany({ orderBy: { name: "asc" } }),
      prisma.sonderpreis.findMany({ include: { produkt: true, lieferant: true }, orderBy: { id: "desc" } }),
    ]);
  } catch {}

  return (
    <div>
      <div className="topbar"><h1>Lieferanten & Sonderpreise</h1></div>

      <LieferantFormular />

      <div className="card" style={{ overflowX: "auto", marginBottom: 28 }}>
        <table className="table">
          <thead><tr><th>Lieferant</th><th>USt-IdNr.</th><th></th></tr></thead>
          <tbody>
            {lieferanten.length === 0 && <tr><td colSpan={3}><div className="empty">Noch keine Lieferanten.</div></td></tr>}
            {lieferanten.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.name}</strong></td>
                <td>{l.ustIdNr ?? "—"}</td>
                <td className="right">
                  <form action={lieferantLoeschen} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-sm" type="submit">Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SonderpreisFormular lieferanten={lieferanten.map((l) => ({ id: l.id, name: l.name }))} />

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr><th>Artikelnr.</th><th>Produkt</th><th>Lieferant</th><th className="num">Preis netto</th><th>Gültig von</th><th>Gültig bis</th><th></th></tr>
          </thead>
          <tbody>
            {sonderpreise.length === 0 && <tr><td colSpan={7}><div className="empty">Keine Sonderpreise.</div></td></tr>}
            {sonderpreise.map((s) => (
              <tr key={s.id}>
                <td>{s.produkt?.artikelnummer}</td>
                <td>{s.produkt?.name}</td>
                <td>{s.lieferant?.name ?? <span className="muted">alle</span>}</td>
                <td className="num">{Number(s.preisNetto).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                <td>{d(s.gueltigVon)}</td>
                <td>{d(s.gueltigBis)}</td>
                <td className="right">
                  <form action={sonderpreisLoeschen} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn btn-sm" type="submit">Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
