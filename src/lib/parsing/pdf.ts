// PDF-Textextraktion. Dynamischer Import des lib-Pfads umgeht die Debug-Routine
// von pdf-parse (die beim Standard-Import eine Testdatei sucht).
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extrahiereText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text ?? "";
}
