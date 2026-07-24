import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [produkte, rechnungen, offen] = await Promise.all([
    prisma.produkt.count().catch(() => 0),
    prisma.rechnung.count().catch(() => 0),
    prisma.rechnung.count({ where: { status: "EINGEGANGEN" } }).catch(() => 0),
  ]);

  return (
    <div>
      <div className="topbar">
        <h1>Übersicht</h1>
      </div>

      <div className="grid grid-3">
        <div className="card card-pad stat">
          <div className="num">{produkte}</div>
          <div className="label">Produkte im Stamm</div>
        </div>
        <div className="card card-pad stat">
          <div className="num">{rechnungen}</div>
          <div className="label">Rechnungen gesamt</div>
        </div>
        <div className="card card-pad stat">
          <div className="num">{offen}</div>
          <div className="label">Offen / ungeprüft</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 24 }}>
        <h3>Willkommen beim Rechnungseingangsprüfer</h3>
        <p className="muted">
          Pflegen Sie zunächst Ihre Produkt-Stammdaten (Preise, Artikelnummern, Kilo/Größe)
          unter <a href="/produkte">Produkte</a>. Anschließend können eingehende Rechnungen
          hochgeladen und automatisch gegen die Stammdaten geprüft werden.
        </p>
      </div>
    </div>
  );
}
