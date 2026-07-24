import Image from "next/image";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginSeite({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="login-wrap">
      <div className="login-card card">
        <div className="login-logo">
          <Image src="/ciloglu-logo.png" alt="Ciloglu" width={120} height={58} priority />
        </div>
        <h2>Rechnungsprüfer</h2>
        <p className="muted" style={{ marginTop: -6 }}>Bitte anmelden</p>
        {sp.error && <div className="flash err">Anmeldung fehlgeschlagen.</div>}
        <form action={login}>
          <input type="hidden" name="next" value={sp.next ?? "/"} />
          <div className="field">
            <label>E-Mail</label>
            <input name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="field">
            <label>Passwort</label>
            <input name="passwort" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: "100%", justifyContent: "center" }}>
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
