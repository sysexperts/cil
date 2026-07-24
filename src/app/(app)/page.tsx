import Link from "next/link";
import { prisma } from "@/lib/db";
import { AmpelBadge, StatusBadge } from "@/components/Ampel";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let produkte = 0, rechnungen = 0, offen = 0;
  const ampel = { GRUEN: 0, GELB: 0, ROT: 0 };
  let letzte: any[] = [];
  try {
    [produkte, rechnungen, offen] = await Promise.all([
      prisma.produkt.count(),
      prisma.rechnung.count(),
      prisma.rechnung.count({ where: { status: "EINGEGANGEN" } }),
    ]);
    const grp = await prisma.rechnung.groupBy({ by: ["ampel"], _count: true });
    for (const g of grp) if (g.ampel) (ampel as any)[g.ampel] = g._count;
    letzte = await prisma.rechnung.findMany({ orderBy: { createdAt: "desc" }, take: 6 });
  } catch {}

  return (
    <div>
      <div className="topbar"><h1>Übersicht</h1></div>

      <div className="grid grid-3">
        <div className="card card-pad stat"><div className="num">{produkte}</div><div className="label">Produkte im Stamm</div></div>
        <div className="card card-pad stat"><div className="num">{rechnungen}</div><div className="label">Rechnungen gesamt</div></div>
        <div className="card card-pad stat"><div className="num">{offen}</div><div className="label">Offen / ungeprüft</div></div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card card-pad stat"><div className="num" style={{ color: "var(--green)" }}>{ampel.GRUEN}</div><div className="label">✓ Ohne Beanstandung</div></div>
        <div className="card card-pad stat"><div className="num" style={{ color: "#b5730e" }}>{ampel.GELB}</div><div className="label">Mit Abweichung (Toleranz)</div></div>
        <div className="card card-pad stat"><div className="num" style={{ color: "var(--red)" }}>{ampel.ROT}</div><div className="label">Mit Fehler / Prüfung nötig</div></div>
      </div>

      <div className="card card-pad" style={{ marginTop: 24 }}>
        <div className="toolbar"><h3 style={{ margin: 0 }}>Zuletzt eingegangen</h3><Link href="/rechnungen" className="btn btn-sm">Alle Rechnungen</Link></div>
        {letzte.length === 0 ? (
          <p className="muted">Noch keine Rechnungen. Laden Sie unter <Link href="/rechnungen">Rechnungen</Link> eine PDF- oder E-Rechnung hoch.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Nummer</th><th>Datum</th><th>Quelle</th><th>Prüfung</th><th>Status</th></tr></thead>
            <tbody>
              {letzte.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/rechnungen/${r.id}`}>{r.nummer ?? "(ohne Nr.)"}</Link></td>
                  <td>{r.datum ? new Date(r.datum).toLocaleDateString("de-DE") : "—"}</td>
                  <td><span className="badge neutral">{r.quelle}</span></td>
                  <td><AmpelBadge ampel={r.ampel} /></td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
