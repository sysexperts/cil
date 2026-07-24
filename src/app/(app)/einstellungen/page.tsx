import { prisma } from "@/lib/db";
import { PasswortFormular, BenutzerFormular } from "./Formulare";

export const dynamic = "force-dynamic";

export default async function EinstellungenSeite() {
  let benutzer: { email: string; name: string | null }[] = [];
  try {
    benutzer = await prisma.user.findMany({ select: { email: true, name: true }, orderBy: { email: "asc" } });
  } catch {}

  return (
    <div>
      <div className="topbar"><h1>Einstellungen</h1></div>
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
