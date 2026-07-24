import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DIR = process.env.STORAGE_DIR || "./storage";

/** Speichert eine hochgeladene Datei sicher und gibt den relativen Pfad zurück. */
export async function speichereDatei(buffer: Buffer, originalName: string): Promise<string> {
  const now = new Date();
  const unter = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const zielDir = path.join(DIR, unter);
  await fs.mkdir(zielDir, { recursive: true });

  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8);
  const name = `${now.getTime()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const voll = path.join(zielDir, name);
  await fs.writeFile(voll, buffer);
  return path.join(unter, name).replace(/\\/g, "/");
}

export async function leseDatei(relPfad: string): Promise<Buffer> {
  const sicher = path.normalize(relPfad).replace(/^(\.\.[/\\])+/, "");
  return fs.readFile(path.join(DIR, sicher));
}
