import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const eur = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AuswertungSeite() {
  let rechnungen: any[] = [];
  let positionen: any[] = [];
  let produkte: any[] = [];
  try {
    [rechnungen, positionen, produkte] = await Promise.all([
      prisma.rechnung.findMany({ select: { lieferantName: true, ampel: true } }),
      prisma.rechnungsposition.findMany({
        where: { artikelnummer: { not: null }, einzelpreis: { not: null } },
        include: { rechnung: { select: { datum: true, createdAt: true } } },
      }),
      prisma.produkt.findMany({ select: { artikelnummer: true, name: true, sollPreisNetto: true } }),
    ]);
  } catch {}

  // --- Lieferanten-Scoring ---
  const scoreMap = new Map<string, { total: number; beanstandet: number; fehler: number }>();
  for (const r of rechnungen) {
    const key = r.lieferantName?.trim() || "(unbekannt)";
    const s = scoreMap.get(key) ?? { total: 0, beanstandet: 0, fehler: 0 };
    s.total++;
    if (r.ampel === "GELB" || r.ampel === "ROT") s.beanstandet++;
    if (r.ampel === "ROT") s.fehler++;
    scoreMap.set(key, s);
  }
  const scoring = [...scoreMap.entries()]
    .map(([name, s]) => ({ name, ...s, quote: s.total ? Math.round((s.beanstandet / s.total) * 100) : 0 }))
    .sort((a, b) => b.quote - a.quote || b.total - a.total);

  // --- Preisverlauf pro Artikel ---
  const prodMap = new Map(produkte.map((p) => [p.artikelnummer, p]));
  const artMap = new Map<string, { preise: { preis: number; zeit: number }[] }>();
  for (const p of positionen) {
    const art = p.artikelnummer as string;
    const preis = Number(p.einzelpreis);
    const zeit = new Date(p.rechnung?.datum ?? p.rechnung?.createdAt ?? Date.now()).getTime();
    const e = artMap.get(art) ?? { preise: [] };
    e.preise.push({ preis, zeit });
    artMap.set(art, e);
  }
  const verlauf = [...artMap.entries()]
    .map(([art, e]) => {
      const sorted = e.preise.sort((a, b) => a.zeit - b.zeit);
      const erster = sorted[0].preis;
      const letzter = sorted[sorted.length - 1].preis;
      const min = Math.min(...sorted.map((x) => x.preis));
      const max = Math.max(...sorted.map((x) => x.preis));
      const prod = prodMap.get(art);
      const soll = prod ? Number(prod.sollPreisNetto) : null;
      const trend = letzter > erster ? "steigend" : letzter < erster ? "fallend" : "stabil";
      return { art, name: prod?.name ?? "—", anzahl: sorted.length, erster, letzter, min, max, soll, trend, ueberSoll: soll != null && letzter > soll + 0.001 };
    })
    .sort((a, b) => (b.letzter - b.erster) - (a.letzter - a.erster));

  return (
    <div>
      <div className="topbar"><h1>Auswertung</h1></div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <h3>Lieferanten-Scoring</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>Anteil beanstandeter Rechnungen (gelb/rot) je Lieferant.</p>
        <table className="table">
          <thead><tr><th>Lieferant</th><th className="num">Rechnungen</th><th className="num">Beanstandet</th><th className="num">Fehler (rot)</th><th className="num">Fehlerquote</th></tr></thead>
          <tbody>
            {scoring.length === 0 && <tr><td colSpan={5}><div className="empty">Keine Daten.</div></td></tr>}
            {scoring.map((s) => (
              <tr key={s.name}>
                <td><strong>{s.name}</strong></td>
                <td className="num">{s.total}</td>
                <td className="num">{s.beanstandet}</td>
                <td className="num">{s.fehler}</td>
                <td className="num">
                  <span className={`badge ${s.quote >= 50 ? "rot" : s.quote > 0 ? "gelb" : "gruen"}`}>{s.quote} %</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card card-pad">
        <h3>Preisverlauf / Trends</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>Preisentwicklung je Artikel aus den eingegangenen Rechnungen.</p>
        <table className="table">
          <thead><tr><th>Artikelnr.</th><th>Bezeichnung</th><th className="num">Vorkommen</th><th className="num">Soll</th><th className="num">Erster</th><th className="num">Letzter</th><th>Trend</th></tr></thead>
          <tbody>
            {verlauf.length === 0 && <tr><td colSpan={7}><div className="empty">Keine Daten.</div></td></tr>}
            {verlauf.map((v) => (
              <tr key={v.art}>
                <td>{v.art}</td>
                <td>{v.name}</td>
                <td className="num">{v.anzahl}</td>
                <td className="num">{v.soll != null ? `${eur(v.soll)} €` : "—"}</td>
                <td className="num">{eur(v.erster)} €</td>
                <td className="num">{eur(v.letzter)} €{v.ueberSoll && <div><span className="badge rot" style={{ fontSize: 10 }}>über Soll</span></div>}</td>
                <td>
                  {v.trend === "steigend" ? <span className="badge gelb">▲ steigend</span>
                    : v.trend === "fallend" ? <span className="badge gruen">▼ fallend</span>
                    : <span className="badge neutral">– stabil</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
