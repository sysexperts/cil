// Reine SVG-Diagramme (serverseitig gerendert, keine externen Bibliotheken).

const FARBE = { GRUEN: "var(--green)", GELB: "#e8a13a", ROT: "var(--red)" };

export function AmpelDonut({ gruen, gelb, rot }: { gruen: number; gelb: number; rot: number }) {
  const daten = [
    { label: "In Ordnung", wert: gruen, farbe: FARBE.GRUEN },
    { label: "Abweichung", wert: gelb, farbe: FARBE.GELB },
    { label: "Fehler", wert: rot, farbe: FARBE.ROT },
  ];
  const gesamt = gruen + gelb + rot;
  const r = 60, cx = 80, cy = 80, umfang = 2 * Math.PI * r, breite = 26;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={160} height={160} viewBox="0 0 160 160" role="img" aria-label="Ampel-Verteilung">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-soft)" strokeWidth={breite} />
        {gesamt > 0 &&
          daten.map((d, i) => {
            const anteil = d.wert / gesamt;
            const len = anteil * umfang;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={d.farbe}
                strokeWidth={breite}
                strokeDasharray={`${len} ${umfang - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += len;
            return el;
          })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--ink)">{gesamt}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">Rechnungen</text>
      </svg>
      <div>
        {daten.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: d.farbe, display: "inline-block" }} />
            <strong>{d.wert}</strong> {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonatsBalken({ daten }: { daten: { label: string; wert: number }[] }) {
  const max = Math.max(1, ...daten.map((d) => d.wert));
  const bh = 120, bw = 40, luecke = 18;
  const breite = daten.length * (bw + luecke) + 20;
  return (
    <svg width="100%" height={bh + 30} viewBox={`0 0 ${Math.max(breite, 300)} ${bh + 30}`} role="img" aria-label="Rechnungen pro Monat">
      {daten.map((d, i) => {
        const h = (d.wert / max) * bh;
        const x = 10 + i * (bw + luecke);
        return (
          <g key={i}>
            <rect x={x} y={bh - h + 5} width={bw} height={h} rx={4} fill="var(--brand)" />
            <text x={x + bw / 2} y={bh - h - 2} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">{d.wert || ""}</text>
            <text x={x + bw / 2} y={bh + 22} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
