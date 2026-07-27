import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AmpelBadge, StatusBadge } from "@/components/Ampel";
import { setzeStatus, neuPruefen, rechnungLoeschen, kommentarHinzufuegen, kommentarLoeschen, freigabeAnfordern } from "../actions";
import { getSessionUser, darfFreigeben } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Abw = { feld: string; schwere: string; nachricht: string; soll?: unknown; ist?: unknown };

function fmt(n: unknown): string {
  if (n == null) return "—";
  return Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RechnungDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.rechnung
    .findUnique({
      where: { id },
      include: {
        positionen: { orderBy: { position: "asc" }, include: { matchedProdukt: true } },
        auditLogs: { orderBy: { createdAt: "desc" } },
        kommentare: { orderBy: { createdAt: "desc" } },
      },
    })
    .catch(() => null);

  if (!r) notFound();

  const user = await getSessionUser();
  const kannFreigeben = darfFreigeben(user?.rolle);

  return (
    <div>
      <div className="topbar">
        <h1>Rechnung {r.nummer ?? "(ohne Nr.)"}</h1>
        <Link href="/rechnungen" className="btn btn-sm">← Zurück</Link>
      </div>

      {r.dublette && (
        <div className="flash err" style={{ marginBottom: 16 }}>
          ⚠ <strong>Mögliche Dublette:</strong> Eine Rechnung mit der Nummer <strong>{r.nummer}</strong> ist bereits im System vorhanden. Bitte vor Freigabe prüfen.
        </div>
      )}

      {/* Kopfdaten */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="detail-grid">
          <div><span className="muted">Datum</span><div>{r.datum ? new Date(r.datum).toLocaleDateString("de-DE") : "—"}</div></div>
          <div><span className="muted">Quelle</span><div>{r.quelle}</div></div>
          <div><span className="muted">Netto</span><div>{fmt(r.nettoSumme)} €</div></div>
          <div><span className="muted">MwSt</span><div>{fmt(r.mwstSumme)} €</div></div>
          <div><span className="muted">Brutto</span><div><strong>{fmt(r.bruttoSumme)} €</strong></div></div>
          <div><span className="muted">Prüfung</span><div><AmpelBadge ampel={r.ampel} /></div></div>
          <div><span className="muted">Status</span><div><StatusBadge status={r.status} /></div></div>
        </div>
      </div>

      {(r.faelligkeitAm || r.skontoProzent) && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 10 }}>Zahlung</h3>
          <div className="detail-grid">
            {r.faelligkeitAm && (
              <div>
                <span className="muted">Fällig am</span>
                <div>{new Date(r.faelligkeitAm).toLocaleDateString("de-DE")}
                  {(() => {
                    const tage = Math.ceil((new Date(r.faelligkeitAm!).getTime() - Date.now()) / 86400000);
                    return <span className="muted"> ({tage < 0 ? `${-tage} Tage überfällig` : `in ${tage} Tagen`})</span>;
                  })()}
                </div>
              </div>
            )}
            {r.skontoProzent && (
              <div>
                <span className="muted">Skonto</span>
                <div>
                  <strong>{Number(r.skontoProzent)} %</strong>
                  {r.skontoBisAm && <> bis {new Date(r.skontoBisAm).toLocaleDateString("de-DE")}</>}
                  {r.nettoSumme != null && (
                    <span className="muted"> · spart {(Number(r.nettoSumme) * Number(r.skontoProzent) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow-Aktionen */}
      <div className="toolbar">
        <div style={{ display: "flex", gap: 8 }}>
          {kannFreigeben ? (
            <>
              <form action={setzeStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="FREIGEGEBEN" />
                <button className="btn btn-primary btn-sm" type="submit">✓ Freigeben</button>
              </form>
              <form action={setzeStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="ABGELEHNT" />
                <button className="btn btn-sm" type="submit">✕ Ablehnen</button>
              </form>
            </>
          ) : (
            <form action={freigabeAnfordern}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btn-primary btn-sm" type="submit">✉ Freigabe anfordern</button>
            </form>
          )}
          <form action={neuPruefen}>
            <input type="hidden" name="id" value={r.id} />
            <button className="btn btn-sm" type="submit">↻ Neu prüfen</button>
          </form>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn btn-sm btn-primary" href={`/rechnungen/${r.id}/bericht`}>📑 Prüfbericht (PDF)</a>
          <a className="btn btn-sm" href={`/rechnungen/${r.id}/export`}>⬇ CSV</a>
          {r.originalDatei && (
            <a className="btn btn-sm" href={`/rechnungen/${r.id}/datei`} target="_blank" rel="noreferrer">📄 Original</a>
          )}
        </div>
      </div>

      {/* Positionen */}
      <div className="card" style={{ overflowX: "auto", marginBottom: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Artikelnr.</th>
              <th>Bezeichnung</th>
              <th className="num">Menge</th>
              <th className="num">Einzelpreis</th>
              <th className="num">Betrag</th>
              <th>Prüfung</th>
              <th>Abweichungen</th>
            </tr>
          </thead>
          <tbody>
            {r.positionen.length === 0 && (
              <tr><td colSpan={8}><div className="empty">Keine Positionen erkannt. Prüfe das Original-PDF.</div></td></tr>
            )}
            {r.positionen.map((p) => {
              const abw = (p.abweichungen as Abw[] | null) ?? [];
              return (
                <tr key={p.id}>
                  <td>{p.position ?? "—"}</td>
                  <td>{p.artikelnummer ?? "—"}{p.matchedProdukt && <div className="muted" style={{ fontSize: 12 }}>✓ {p.matchedProdukt.name}</div>}</td>
                  <td>{p.bezeichnung ?? "—"}</td>
                  <td className="num">{p.menge != null ? fmt(p.menge) : "—"} {p.einheit ?? ""}</td>
                  <td className="num">{fmt(p.einzelpreis)} €</td>
                  <td className="num">{fmt(p.positionsbetrag)} €</td>
                  <td><AmpelBadge ampel={p.ampel} /></td>
                  <td>
                    {abw.length === 0 ? <span className="muted">—</span> : (
                      <ul className="abw-list">
                        {abw.map((a, i) => (
                          <li key={i} className={`abw abw-${a.schwere}`}>
                            {a.nachricht}
                            {a.soll != null && <span className="muted"> (Soll: {String(a.soll)}, Ist: {String(a.ist)})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Kommentare / Notizen */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h3>Kommentare & Notizen</h3>
        <form action={kommentarHinzufuegen} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input type="hidden" name="rechnungId" value={r.id} />
          <input name="text" placeholder="Notiz oder Rückfrage hinzufügen…" required
            style={{ flex: 1, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8 }} />
          <button className="btn btn-primary btn-sm" type="submit">Hinzufügen</button>
        </form>
        {r.kommentare.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>Noch keine Kommentare.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {r.kommentare.map((k) => (
              <li key={k.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 14 }}>{k.text}</div>
                <div className="muted" style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  {k.autor ?? "—"} · {new Date(k.createdAt).toLocaleString("de-DE")}
                  <form action={kommentarLoeschen} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={k.id} />
                    <input type="hidden" name="rechnungId" value={r.id} />
                    <button className="btn btn-sm" type="submit" style={{ padding: "2px 8px", fontSize: 11 }}>löschen</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Audit-Trail */}
      <div className="card card-pad">
        <h3>Verlauf (Audit-Trail)</h3>
        <ul className="audit">
          {r.auditLogs.map((a) => (
            <li key={a.id}>
              <span className="muted">{new Date(a.createdAt).toLocaleString("de-DE")}</span> — {a.aktion}
            </li>
          ))}
        </ul>
        <form action={rechnungLoeschen} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={r.id} />
          <button className="btn btn-sm" type="submit">Rechnung löschen</button>
        </form>
      </div>
    </div>
  );
}
