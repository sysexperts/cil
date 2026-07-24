import { prisma } from "@/lib/db";
import ProduktListe, { type ProduktRow } from "./ProduktListe";

export const dynamic = "force-dynamic";

export default async function ProdukteSeite() {
  let produkte: ProduktRow[] = [];
  try {
    const rows = await prisma.produkt.findMany({ orderBy: { name: "asc" } });
    produkte = rows.map((p) => ({
      id: p.id,
      artikelnummer: p.artikelnummer,
      ean: p.ean,
      name: p.name,
      kategorie: p.kategorie,
      marke: p.marke,
      einheit: p.einheit,
      gebindeGroesse: p.gebindeGroesse,
      gewichtKg: p.gewichtKg?.toString() ?? null,
      sollPreisNetto: p.sollPreisNetto.toString(),
      mwstSatz: p.mwstSatz.toString(),
      preisToleranz: p.preisToleranz.toString(),
      aktiv: p.aktiv,
    }));
  } catch {
    // DB evtl. noch nicht migriert
  }

  return (
    <div>
      <div className="topbar">
        <h1>Produkte</h1>
      </div>
      <p className="muted" style={{ marginTop: -12, marginBottom: 20 }}>
        Stammdaten für die Rechnungsprüfung: Artikelnummer, Preis, Gebinde/Größe und Gewicht.
      </p>
      <ProduktListe produkte={produkte} />
    </div>
  );
}
