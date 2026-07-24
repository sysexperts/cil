// Einmalig: persönliches Konto anlegen + Admin-Passwort auf Zufallswert setzen.
// Aufruf: tsx scripts/secure-accounts.ts <email> <userPw> <adminPw>
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

(async () => {
  const [email, userPw, adminPw] = process.argv.slice(2);
  if (!email || !userPw || !adminPw) throw new Error("Argumente: <email> <userPw> <adminPw>");

  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwortHash: await bcrypt.hash(userPw, 10) },
    create: { email: email.toLowerCase(), name: "Serdar Vapur", passwortHash: await bcrypt.hash(userPw, 10) },
  });

  const admin = await prisma.user.findUnique({ where: { email: "admin@ciloglu.de" } });
  if (admin) {
    await prisma.user.update({ where: { id: admin.id }, data: { passwortHash: await bcrypt.hash(adminPw, 10) } });
  }
  console.log("OK: Konto", email, "angelegt/aktualisiert; Admin-Passwort neu gesetzt.");
  await prisma.$disconnect();
})();
