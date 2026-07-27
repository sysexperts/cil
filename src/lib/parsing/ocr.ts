import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

// OCR über den System-Tesseract (im Container installiert). Liest ein Bild
// (JPG/PNG) und gibt den erkannten Text zurück. Deutsch + Englisch.
export async function ocrBild(buffer: Buffer): Promise<string> {
  const tmp = path.join(os.tmpdir(), `ocr-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`);
  const eingabe = `${tmp}.img`;
  await fs.writeFile(eingabe, buffer);
  try {
    return await tesseract(eingabe);
  } finally {
    await fs.unlink(eingabe).catch(() => {});
  }
}

function tesseract(datei: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // "stdout" -> Text auf stdout; -l deu+eng; --psm 6: gleichmäßiger Textblock
    const p = spawn("tesseract", [datei, "stdout", "-l", "deu+eng", "--psm", "6"]);
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`Tesseract-Fehler (${code}): ${err.slice(0, 200)}`));
    });
  });
}

export function istBild(dateiname: string, mime?: string): boolean {
  const n = dateiname.toLowerCase();
  return (
    n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png") || n.endsWith(".tif") || n.endsWith(".tiff") ||
    (mime ?? "").startsWith("image/")
  );
}
