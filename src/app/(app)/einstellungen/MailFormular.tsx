"use client";

import { useActionState, useState } from "react";
import { mailKonfigSpeichern, testmailSenden } from "./mail-actions";

type Props = {
  konfig: {
    aktiv: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    absender: string;
    empfaenger: string;
    nurBeiRot: boolean;
    hatPasswort: boolean;
  };
};

export default function MailFormular({ konfig }: Props) {
  const [saveState, saveAction, saving] = useActionState(mailKonfigSpeichern, { ok: false, error: "" });
  const [testState, testAction, testing] = useActionState(testmailSenden, { ok: false, error: "" });

  // Kontrollierte Felder, damit die Testmail dieselben Werte nutzt.
  const [f, setF] = useState({
    aktiv: konfig.aktiv,
    smtpHost: konfig.smtpHost,
    smtpPort: String(konfig.smtpPort),
    smtpUser: konfig.smtpUser,
    smtpPasswort: "",
    absender: konfig.absender,
    empfaenger: konfig.empfaenger,
    nurBeiRot: konfig.nurBeiRot,
  });
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const felder = (
    <>
      <input type="hidden" name="aktiv" value={f.aktiv ? "on" : ""} />
      <input type="hidden" name="nurBeiRot" value={f.nurBeiRot ? "on" : ""} />
      <input type="hidden" name="smtpHost" value={f.smtpHost} />
      <input type="hidden" name="smtpPort" value={f.smtpPort} />
      <input type="hidden" name="smtpUser" value={f.smtpUser} />
      <input type="hidden" name="smtpPasswort" value={f.smtpPasswort} />
      <input type="hidden" name="absender" value={f.absender} />
      <input type="hidden" name="empfaenger" value={f.empfaenger} />
    </>
  );

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Benachrichtigungen (E-Mail)</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
        Bei fehlerhaften Rechnungen wird automatisch eine E-Mail versendet. SMTP-Zugang Ihres
        Postfach-Anbieters eintragen (IONOS, Strato, Gmail/Microsoft 365 ggf. mit App-Passwort).
      </p>
      {saveState.ok && <div className="flash ok">Einstellungen gespeichert.</div>}
      {saveState.error && <div className="flash err">{saveState.error}</div>}
      {testState.ok && <div className="flash ok">Testmail versendet — bitte Postfach prüfen.</div>}
      {testState.error && <div className="flash err">{testState.error}</div>}

      <div className="field">
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={f.aktiv} onChange={(e) => set("aktiv", e.target.checked)} style={{ width: "auto" }} />
          Benachrichtigung aktiv
        </label>
      </div>
      <div className="form-row">
        <div className="field"><label>SMTP-Server</label><input value={f.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.ionos.de" /></div>
        <div className="field"><label>Port</label><input value={f.smtpPort} onChange={(e) => set("smtpPort", e.target.value)} inputMode="numeric" placeholder="587" /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Benutzer (E-Mail)</label><input value={f.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} placeholder="rechnungen@ciloglu.de" /></div>
        <div className="field"><label>Passwort {konfig.hatPasswort && <span className="muted">(gespeichert — leer lassen zum Beibehalten)</span>}</label><input type="password" value={f.smtpPasswort} onChange={(e) => set("smtpPasswort", e.target.value)} autoComplete="new-password" /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Absender</label><input value={f.absender} onChange={(e) => set("absender", e.target.value)} placeholder="rechnungspruefer@ciloglu.de" /></div>
        <div className="field"><label>Empfänger (Komma-getrennt)</label><input value={f.empfaenger} onChange={(e) => set("empfaenger", e.target.value)} placeholder="buchhaltung@ciloglu.de" /></div>
      </div>
      <div className="field">
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={f.nurBeiRot} onChange={(e) => set("nurBeiRot", e.target.checked)} style={{ width: "auto" }} />
          Nur bei Fehlern (rot) benachrichtigen — sonst auch bei gelben Abweichungen
        </label>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <form action={saveAction}>{felder}<button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</button></form>
        <form action={testAction}>{felder}<button className="btn" type="submit" disabled={testing}>{testing ? "Sende…" : "Testmail senden"}</button></form>
      </div>
    </div>
  );
}
