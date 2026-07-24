import Link from "next/link";
import { prisma } from "@/lib/db";
import UploadFormular from "./UploadFormular";
import { AmpelBadge, StatusBadge } from "@/components/Ampel";

export const dynamic = "force-dynamic";

function fmt(n: unknown): string {
  if (n == null) return "—";
  return Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default async function RechnungenSeite() {
  let rechnungen: any[] = [];
  try {
    rechnungen = await prisma.rechnung.findMany({
      orderBy: { createdAt: "desc" },
      include: { lieferant: true, _count: { select: { positionen: true } } },
    });
  } catch {
    /* DB evtl. nicht migriert */
  }

  return (
    <div>
      <div className="topbar">
        <h1>Rechnungen</h1>
        {rechnungen.length > 0 && (
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a className="btn btn-sm" href="/rechnungen/export">⬇ CSV-Export</a>
        )}
      </div>
      <UploadFormular />

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nummer</th>
              <th>Datum</th>
              <th>Quelle</th>
              <th className="num">Positionen</th>
              <th className="num">Netto</th>
              <th className="num">Brutto</th>
              <th>Prüfung</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rechnungen.length === 0 && (
              <tr><td colSpan={8}><div className="empty">Noch keine Rechnungen. Lade oben eine PDF hoch.</div></td></tr>
            )}
            {rechnungen.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/rechnungen/${r.id}`}><strong>{r.nummer ?? "(ohne Nr.)"}</strong></Link></td>
                <td>{r.datum ? new Date(r.datum).toLocaleDateString("de-DE") : "—"}</td>
                <td><span className="badge neutral">{r.quelle}</span></td>
                <td className="num">{r._count?.positionen ?? 0}</td>
                <td className="num">{fmt(r.nettoSumme)}</td>
                <td className="num">{fmt(r.bruttoSumme)}</td>
                <td><AmpelBadge ampel={r.ampel} /></td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
