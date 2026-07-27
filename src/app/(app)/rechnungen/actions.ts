"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { verarbeiteUpload } from "@/lib/rechnungen/verarbeiten";
import { prüfeErneut } from "@/lib/rechnungen/verarbeiten";

const ERLAUBT = new Set(["application/pdf"]);
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || "20");

export async function rechnungUpload(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  const file = formData.get("datei");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Keine Datei ausgewählt." };
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return { ok: false, error: `Datei zu groß (max. ${MAX_MB} MB).` };
  }
  const name = file.name.toLowerCase();
  const istPdf = ERLAUBT.has(file.type || "") || name.endsWith(".pdf");
  const istXml = name.endsWith(".xml");
  const istBild = /\.(jpg|jpeg|png|tif|tiff)$/.test(name) || (file.type || "").startsWith("image/");
  if (!istPdf && !istXml && !istBild) {
    return { ok: false, error: "Unterstützt werden PDF, Bild (Scan/Foto) und XML (ZUGFeRD/XRechnung)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let id: string;
  try {
    const res = await verarbeiteUpload({ buffer, dateiname: file.name, userId: user?.sub });
    id = res.id;
  } catch {
    return { ok: false, error: "Verarbeitung fehlgeschlagen." };
  }
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${id}`);
}

export async function setzeStatus(formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["FREIGEGEBEN", "ABGELEHNT", "GEPRUEFT"].includes(status)) return;

  await prisma.rechnung.update({ where: { id }, data: { status: status as never } });
  await prisma.auditLog.create({
    data: { userId: user?.sub ?? null, rechnungId: id, aktion: `STATUS_${status}`, details: { status } },
  });
  revalidatePath(`/rechnungen/${id}`);
  revalidatePath("/rechnungen");
}

export async function neuPruefen(formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prüfeErneut(id, user?.sub);
  revalidatePath(`/rechnungen/${id}`);
  revalidatePath("/rechnungen");
}

export async function rechnungLoeschen(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.rechnung.delete({ where: { id } }).catch(() => {});
  revalidatePath("/rechnungen");
  redirect("/rechnungen");
}
