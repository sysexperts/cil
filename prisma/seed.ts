import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Demo-Login (in Produktion ändern!)
  const email = "admin@ciloglu.de";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Administrator", passwortHash: await bcrypt.hash("changeme", 10) },
  });

  // Ein paar Beispiel-Produkte
  const demo = [
    { artikelnummer: "10001", name: "Efendiler Oliven schwarz", kategorie: "Oliven", marke: "Efendiler", einheit: "Karton", gebindeGroesse: "12x800g", gewichtKg: 9.6, sollPreisNetto: 28.5 },
    { artikelnummer: "10002", name: "Fig-S Trockenfeigen", kategorie: "Trockenfrüchte", marke: "Fig-S", einheit: "Karton", gebindeGroesse: "10x1kg", gewichtKg: 10, sollPreisNetto: 42.0 },
    { artikelnummer: "10003", name: "Göz Karası Paprika edelsüß", kategorie: "Gewürze", marke: "Göz Karası", einheit: "Stk", gebindeGroesse: "500g", gewichtKg: 0.5, sollPreisNetto: 3.9 },
  ];
  for (const p of demo) {
    await prisma.produkt.upsert({
      where: { artikelnummer: p.artikelnummer },
      update: {},
      create: p,
    });
  }
  console.log("Seed abgeschlossen.");
}

main().finally(() => prisma.$disconnect());
