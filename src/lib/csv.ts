// CSV im deutschen Excel-Format (Semikolon-getrennt, UTF-8 mit BOM).
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => r.map(esc).join(";")).join("\r\n");
  return "﻿" + body;
}

export function csvResponse(csv: string, dateiname: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
    },
  });
}
