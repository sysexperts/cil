"use client";

import { useActionState } from "react";
import { imapKonfigSpeichern } from "./mail-actions";

type Props = {
  konfig: { imapAktiv: boolean; imapHost: string; imapPort: number; imapUser: string; imapOrdner: string; hatPasswort: boolean };
};

export default function ImapFormular({ konfig }: Props) {
  const [state, action, saving] = useActionState(imapKonfigSpeichern, { ok: false, error: "" });
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Automatischer E-Mail-Eingang (IMAP)</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
        Rechnungen werden aus einem Postfach automatisch abgeholt und geprüft (Anhänge: PDF, XML,
        Bild). Ein Hintergrund-Job prüft das Postfach regelmäßig.
      </p>
      {state.ok && <div className="flash ok">IMAP-Einstellungen gespeichert.</div>}
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="field">
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="imapAktiv" defaultChecked={konfig.imapAktiv} style={{ width: "auto" }} />
            E-Mail-Eingang aktiv
          </label>
        </div>
        <div className="form-row">
          <div className="field"><label>IMAP-Server</label><input name="imapHost" defaultValue={konfig.imapHost} placeholder="imap.ionos.de" /></div>
          <div className="field"><label>Port</label><input name="imapPort" defaultValue={String(konfig.imapPort || 993)} inputMode="numeric" /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>Benutzer (E-Mail)</label><input name="imapUser" defaultValue={konfig.imapUser} placeholder="rechnungen@ciloglu.de" /></div>
          <div className="field"><label>Passwort {konfig.hatPasswort && <span className="muted">(gespeichert)</span>}</label><input type="password" name="imapPasswort" autoComplete="new-password" /></div>
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label>Ordner</label><input name="imapOrdner" defaultValue={konfig.imapOrdner || "INBOX"} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</button>
      </form>
    </div>
  );
}
