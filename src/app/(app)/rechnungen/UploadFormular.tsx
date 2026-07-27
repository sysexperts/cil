"use client";

import { useActionState } from "react";
import { rechnungUpload } from "./actions";

export default function UploadFormular() {
  const [state, action, pending] = useActionState(rechnungUpload, { ok: false, error: "" });
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3>Rechnung hochladen</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>
        PDF, gescannte Rechnung / Foto (JPG/PNG, wird per OCR gelesen) oder E-Rechnung
        (ZUGFeRD/XRechnung, XML). Wird automatisch ausgelesen und gegen die Stammdaten geprüft.
      </p>
      {state.error && <div className="flash err">{state.error}</div>}
      <form action={action}>
        <div className="field">
          <input type="file" name="datei" accept="application/pdf,.pdf,.xml,text/xml,application/xml,image/*,.jpg,.jpeg,.png,.tif,.tiff" required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Verarbeite…" : "Hochladen & prüfen"}
        </button>
      </form>
    </div>
  );
}
