import Link from "next/link";
import { prisma } from "@/lib/db";
import { AmpelBadge, StatusBadge } from "@/components/Ampel";
import { AmpelDonut, MonatsBalken } from "@/components/Charts";

export const dynamic = "force-dynamic";

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default async function Dashboard() {
  let produkte = 0, rechnungen = 0, offen = 0;
  const ampel = { GRUEN: 0, GELB: 0, ROT: 0 };
  let letzte: any[] = [];
  let alle: { createdAt: Date }[] = [];
  try {
    [produkte, rechnungen, offen] = await Promise.all([
      prisma.produkt.count(),
      prisma.rechnung.count(),
      prisma.rechnung.count({ where: { status: "EINGEGANGEN" } }),
    ]);
    const grp = await prisma.rechnung.groupBy({ by: ["ampel"], _count: true });
    for (const g of grp) if (g.ampel) (ampel as any)[g.ampel] = g._count;
    letzte = await prisma.rechnung.findMany({ orderBy: { createdAt: "desc" }, take: 6 });
    alle = await prisma.rechnung.findMany({ select: { createdAt: true } });
  } catch {}

  // Letzte 6 Monate als Balken
  const jetzt = new Date();
  const monate: { label: string; wert: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth() - i, 1);
    monate.push({ label: MONATE[d.getMonth()], wert: 0, key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  for (const r of alle) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = monate.find((x) => x.key === key);
    if (m) m.wert++;
  }

  return (
    <div>
      <div className="topbar"><h1>Übersicht</h1></div>

      <div className="grid grid-3">
        <div className="card card-pad stat"><div className="num">{produkte}</div><div className="label">Produkte im Stamm</div></div>
        <div className="card card-pad stat"><div className="num">{rechnungen}</div><div className="label">Rechnungen gesamt</div></div>
        <div className="card card-pad stat"><div className="num">{offen}</div><div className="label">Offen / ungeprüft</div></div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Prüfergebnisse</h3>
          <AmpelDonut gruen={ampel.GRUEN} gelb={ampel.GELB} rot={ampel.ROT} />
        </div>
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16 }}>Rechnungen pro Monat</h3>
          <MonatsBalken daten={monate.map(({ label, wert }) => ({ label, wert }))} />
        </div>
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
