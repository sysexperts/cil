// PDF-Textextraktion mit unpdf (modernes, gepflegtes pdf.js, serverless-tauglich).
import { extractText, getDocumentProxy } from "unpdf";

export async function extrahiereText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : (text ?? "");
}

// Extrahiert eingebettetes ZUGFeRD/Factur-X-XML aus einem PDF/A-3 (falls vorhanden).
export async function extrahiereZugferdXml(buffer: Buffer): Promise<string | null> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const attachments = (await pdf.getAttachments()) as Record<string, { filename: string; content: Uint8Array }> | null;
    if (!attachments) return null;
    for (const key of Object.keys(attachments)) {
      const att = attachments[key];
      const name = (att.filename || key).toLowerCase();
      if (name.endsWith(".xml") || name.includes("factur-x") || name.includes("zugferd") || name.includes("xrechnung")) {
        return new TextDecoder("utf-8").decode(att.content);
      }
    }
  } catch {
    /* keine Anhänge / kein PDF/A-3 */
  }
  return null;
}
