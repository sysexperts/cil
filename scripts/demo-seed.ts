// Demo-Stammdaten: realistische Ciloglu-Produkte (Marken/Kategorien).
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const produkte = [
  { artikelnummer: "10001", name: "Efendiler Oliven schwarz", kategorie: "Oliven", marke: "Efendiler", einheit: "Karton", gebindeGroesse: "12x800g", gewichtKg: 9.6, sollPreisNetto: 28.5, preisToleranz: 2 },
  { artikelnummer: "10002", name: "Fig-S Trockenfeigen", kategorie: "Trockenfrüchte", marke: "Fig-S", einheit: "Karton", gebindeGroesse: "10x1kg", gewichtKg: 10, sollPreisNetto: 42.0, preisToleranz: 0 },
  { artikelnummer: "10003", name: "Göz Karası Paprika edelsüß", kategorie: "Gewürze", marke: "Göz Karası", einheit: "Stk", gebindeGroesse: "500g", gewichtKg: 0.5, sollPreisNetto: 3.9, preisToleranz: 0 },
  { artikelnummer: "10004", name: "Efendiler Oliven grün gefüllt", kategorie: "Oliven", marke: "Efendiler", einheit: "Karton", gebindeGroesse: "12x700g", gewichtKg: 8.4, sollPreisNetto: 26.9, preisToleranz: 2 },
  { artikelnummer: "10005", name: "Yutty Fruchtgummi Mix", kategorie: "Süßwaren", marke: "Yutty", einheit: "Karton", gebindeGroesse: "24x100g", gewichtKg: 2.4, sollPreisNetto: 15.6, preisToleranz: 0 },
  { artikelnummer: "10006", name: "Bi-Ye Sesamriegel", kategorie: "Süßwaren", marke: "Bi-Ye", einheit: "Karton", gebindeGroesse: "20x50g", gewichtKg: 1.0, sollPreisNetto: 12.0, preisToleranz: 0 },
  { artikelnummer: "10007", name: "Göz Karası Kreuzkümmel gemahlen", kategorie: "Gewürze", marke: "Göz Karası", einheit: "Stk", gebindeGroesse: "250g", gewichtKg: 0.25, sollPreisNetto: 2.4, preisToleranz: 0 },
  { artikelnummer: "10008", name: "Fig-S Aprikosen getrocknet", kategorie: "Trockenfrüchte", marke: "Fig-S", einheit: "Karton", gebindeGroesse: "10x1kg", gewichtKg: 10, sollPreisNetto: 39.5, preisToleranz: 3 },
  { artikelnummer: "10009", name: "Rote Linsen", kategorie: "Hülsenfrüchte", marke: "Ciloglu", einheit: "Sack", gebindeGroesse: "25kg", gewichtKg: 25, sollPreisNetto: 32.0, preisToleranz: 5 },
  { artikelnummer: "10010", name: "Bulgur grob", kategorie: "Hülsenfrüchte", marke: "Ciloglu", einheit: "Sack", gebindeGroesse: "10kg", gewichtKg: 10, sollPreisNetto: 14.5, preisToleranz: 5 },
  { artikelnummer: "10011", name: "Bi-İç Ayran", kategorie: "Getränke", marke: "Bi-İç", einheit: "Karton", gebindeGroesse: "12x250ml", gewichtKg: 3.0, sollPreisNetto: 6.9, preisToleranz: 0 },
  { artikelnummer: "10012", name: "Granatapfelsauce", kategorie: "Saucen", marke: "Ciloglu", einheit: "Karton", gebindeGroesse: "12x350ml", gewichtKg: 4.2, sollPreisNetto: 21.0, preisToleranz: 0 },
];

(async () => {
  for (const p of produkte) {
    await prisma.produkt.upsert({ where: { artikelnummer: p.artikelnummer }, update: p, create: p });
  }
  const n = await prisma.produkt.count();
  console.log(`Demo-Stammdaten geladen. Produkte gesamt: ${n}`);
  await prisma.$disconnect();
})();
