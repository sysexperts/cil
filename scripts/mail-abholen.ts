// Automatischer E-Mail-Eingang: holt ungelesene Mails per IMAP ab, verarbeitet
// Rechnungs-Anhänge (PDF/XML/Bild) und markiert die Mails als gelesen.
// Läuft als eigenständiger Cron-Job, unabhängig von der Web-App.
// Aufruf: tsx scripts/mail-abholen.ts
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/db";
import { verarbeiteUpload } from "@/lib/rechnungen/verarbeiten";

const ERLAUBT = /\.(pdf|xml|jpg|jpeg|png|tif|tiff)$/i;

(async () => {
  const cfg = await prisma.mailEinstellung.findUnique({ where: { id: "default" } });
  if (!cfg?.imapAktiv || !cfg.imapHost || !cfg.imapUser) {
    console.log("IMAP nicht aktiviert/konfiguriert — nichts zu tun.");
    await prisma.$disconnect();
    return;
  }

  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: cfg.imapPort === 993,
    auth: { user: cfg.imapUser, pass: cfg.imapPasswort ?? "" },
    logger: false,
  });

  let verarbeitet = 0;
  await client.connect();
  const lock = await client.getMailboxLock(cfg.imapOrdner || "INBOX");
  try {
    const uids = (await client.search({ seen: false })) || [];
    for (const uid of uids) {
      const dl = await client.download(String(uid));
      if (!dl?.content) continue;
      const parsed = await simpleParser(dl.content);
      for (const att of parsed.attachments || []) {
        const name = att.filename || "anhang";
        if (ERLAUBT.test(name)) {
          try {
            await verarbeiteUpload({ buffer: att.content as Buffer, dateiname: name, quelle: "MAIL" });
            verarbeitet++;
          } catch (e) {
            console.error("Anhang-Verarbeitung fehlgeschlagen:", name, e);
          }
        }
      }
      await client.messageFlagsAdd(String(uid), ["\\Seen"]);
    }
  } finally {
    lock.release();
  }
  await client.logout();
  console.log(`IMAP fertig. Verarbeitete Rechnungs-Anhänge: ${verarbeitet}`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("IMAP-Abholung fehlgeschlagen:", e);
  process.exit(1);
});
