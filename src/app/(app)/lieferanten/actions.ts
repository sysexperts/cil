"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseBetrag } from "@/lib/parsing/number";

export async function lieferantSpeichern(_prev: unknown, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const ustIdNr = String(formData.get("ustIdNr") ?? "").trim() || null;
  if (!name) return { ok: false, error: "Name erforderlich." };
  try {
    if (id) await prisma.lieferant.update({ where: { id }, data: { name, ustIdNr } });
    else await prisma.lieferant.create({ data: { name, ustIdNr } });
  } catch {
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }
  revalidatePath("/lieferanten");
  return { ok: true, error: "" };
}

export async function lieferantLoeschen(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.lieferant.delete({ where: { id } }).catch(() => {});
  revalidatePath("/lieferanten");
}

export async function sonderpreisSpeichern(_prev: unknown, formData: FormData) {
  const artikelnummer = String(formData.get("artikelnummer") ?? "").trim();
  const lieferantId = String(formData.get("lieferantId") ?? "") || null;
  const preis = parseBetrag(String(formData.get("preisNetto") ?? ""));
  const von = String(formData.get("gueltigVon") ?? "");
  const bis = String(formData.get("gueltigBis") ?? "");

  if (!artikelnummer) return { ok: false, error: "Artikelnummer erforderlich." };
  if (preis == null || preis < 0) return { ok: false, error: "Preis ungültig." };

  const produkt = await prisma.produkt.findUnique({ where: { artikelnummer } });
  if (!produkt) return { ok: false, error: `Kein Produkt mit Artikelnummer ${artikelnummer}.` };

  try {
    await prisma.sonderpreis.create({
      data: {
        produktId: produkt.id,
        lieferantId,
        preisNetto: preis,
        gueltigVon: von ? new Date(von) : null,
        gueltigBis: bis ? new Date(bis) : null,
      },
    });
  } catch {
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }
  revalidatePath("/lieferanten");
  return { ok: true, error: "" };
}

export async function sonderpreisLoeschen(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.sonderpreis.delete({ where: { id } }).catch(() => {});
  revalidatePath("/lieferanten");
}
