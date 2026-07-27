import { prisma } from "@/lib/db";
import { PasswortFormular, BenutzerFormular } from "./Formulare";
import MailFormular from "./MailFormular";
import { getSessionUser, istAdmin } from "@/lib/auth";
import { rolleAendern } from "./actions";

export const dynamic = "force-dynamic";

const ROLLE_LABEL: Record<string, string> = { ADMIN: "Administrator", FREIGEBER: "Freigeber", PRUEFER: "Prüfer" };

export default async function EinstellungenSeite() {
  const user = await getSessionUser();
  const admin = istAdmin(user?.rolle);

  let benutzer: { email: string; name: string | null; rolle: string }[] = [];
  let mail = null as any;
  try {
    [benutzer, mail] = await Promise.all([
      prisma.user.findMany({ select: { email: true, name: true, rolle: true }, orderBy: { email: "asc" } }),
      prisma.mailEinstellung.findUnique({ where: { id: "default" } }),
    ]);
  } catch {}

  const mailKonfig = {
    aktiv: mail?.aktiv ?? false,
    smtpHost: mail?.smtpHost ?? "",
    smtpPort: mail?.smtpPort ?? 587,
    smtpUser: mail?.smtpUser ?? "",
    absender: mail?.absender ?? "",
    empfaenger: mail?.empfaenger ?? "",
    nurBeiRot: mail?.nurBeiRot ?? true,
    hatPasswort: Boolean(mail?.smtpPasswort),
  };

  return (
    <div>
      <div className="topbar"><h1>Einstellungen</h1></div>
      {admin && <MailFormular konfig={mailKonfig} />}
      <PasswortFormular />
      {admin && <BenutzerFormular />}

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h3>Benutzer ({benutzer.length})</h3>
        <table className="table">
          <thead><tr><th>Name / E-Mail</th><th>Rolle</th>{admin && <th></th>}</tr></thead>
          <tbody>
            {benutzer.map((b) => (
              <tr key={b.email}>
                <td>{b.name ? `${b.name} — ` : ""}{b.email}</td>
                <td><span className="badge neutral">{ROLLE_LABEL[b.rolle] ?? b.rolle}</span></td>
                {admin && (
                  <td className="right">
                    <form action={rolleAendern} style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <input type="hidden" name="email" value={b.email} />
                      <select name="rolle" defaultValue={b.rolle} style={{ padding: "4px 8px" }}>
                        <option value="PRUEFER">Prüfer</option>
                        <option value="FREIGEBER">Freigeber</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                      <button className="btn btn-sm" type="submit">Speichern</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
