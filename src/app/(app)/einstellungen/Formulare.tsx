"use client";

import { useActionState } from "react";
import { passwortAendern, benutzerAnlegen } from "./actions";

export function PasswortFormular() {
  const [state, action, pending] = useActionState(passwortAendern, { ok: false, error: "" });
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Passwort ändern</h3>
      {state.ok && <div className="flash ok">Passwort wurde geändert.</div>}
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="field">
          <label>Aktuelles Passwort</label>
          <input name="aktuell" type="password" autoComplete="current-password" required />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Neues Passwort</label>
            <input name="neu" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="field">
            <label>Neues Passwort (Wiederholung)</label>
            <input name="neu2" type="password" autoComplete="new-password" required minLength={8} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Speichern…" : "Passwort ändern"}</button>
      </form>
    </div>
  );
}

export function BenutzerFormular() {
  const [state, action, pending] = useActionState(benutzerAnlegen, { ok: false, error: "" });
  return (
    <div className="card card-pad">
      <h3>Benutzer anlegen</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>Weitere Team-Mitglieder für den Zugang.</p>
      {state.ok && <div className="flash ok">Benutzer angelegt.</div>}
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="form-row">
          <div className="field">
            <label>E-Mail</label>
            <input name="email" type="email" required />
          </div>
          <div className="field">
            <label>Name</label>
            <input name="name" type="text" />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Passwort</label>
            <input name="passwort" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="field">
            <label>Rolle</label>
            <select name="rolle" defaultValue="PRUEFER">
              <option value="PRUEFER">Prüfer (hochladen/prüfen)</option>
              <option value="FREIGEBER">Freigeber (darf freigeben)</option>
              <option value="ADMIN">Administrator (alles)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Anlegen…" : "Benutzer anlegen"}</button>
      </form>
    </div>
  );
}
