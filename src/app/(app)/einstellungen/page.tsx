import { prisma } from "@/lib/db";
import { PasswortFormular, BenutzerFormular } from "./Formulare";
import MailFormular from "./MailFormular";

export const dynamic = "force-dynamic";

export default async function EinstellungenSeite() {
  let benutzer: { email: string; name: string | null }[] = [];
  let mail = null as any;
  try {
    [benutzer, mail] = await Promise.all([
      prisma.user.findMany({ select: { email: true, name: true }, orderBy: { email: "asc" } }),
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
      <MailFormular konfig={mailKonfig} />
      <PasswortFormular />
      <BenutzerFormular />
      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h3>Benutzer ({benutzer.length})</h3>
        <ul className="audit">
          {benutzer.map((b) => (
            <li key={b.email}>{b.name ? `${b.name} — ` : ""}{b.email}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
