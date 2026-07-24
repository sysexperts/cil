export function AmpelBadge({ ampel }: { ampel?: string | null }) {
  const map: Record<string, { cls: string; label: string }> = {
    GRUEN: { cls: "gruen", label: "OK" },
    GELB: { cls: "gelb", label: "Abweichung" },
    ROT: { cls: "rot", label: "Fehler" },
  };
  const m = ampel ? map[ampel] : null;
  if (!m) return <span className="badge neutral">—</span>;
  return <span className={`badge ${m.cls}`}>● {m.label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    EINGEGANGEN: "neutral",
    GEPRUEFT: "gelb",
    FREIGEGEBEN: "gruen",
    ABGELEHNT: "rot",
  };
  const label: Record<string, string> = {
    EINGEGANGEN: "Eingegangen",
    GEPRUEFT: "Geprüft",
    FREIGEGEBEN: "Freigegeben",
    ABGELEHNT: "Abgelehnt",
  };
  return <span className={`badge ${map[status] ?? "neutral"}`}>{label[status] ?? status}</span>;
}
