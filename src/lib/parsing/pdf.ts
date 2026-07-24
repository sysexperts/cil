// PDF-Textextraktion mit unpdf (modernes, gepflegtes pdf.js, serverless-tauglich).
import { extractText, getDocumentProxy } from "unpdf";

export async function extrahiereText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : (text ?? "");
}
