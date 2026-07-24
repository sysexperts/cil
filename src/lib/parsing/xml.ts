import { XMLParser } from "fast-xml-parser";
import { parseBetrag, parseDatum } from "./number";
import type { ParsedInvoice, ParsedPosition } from "@/lib/validation/engine";

// Parst strukturierte E-Rechnungen: CII (ZUGFeRD/Factur-X) und UBL (XRechnung).
// Namespaces werden entfernt, danach generischer Zugriff.

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

function asArray<T>(x: T | T[] | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

// Wert eines Knotens holen (Text oder #text bei Attributen)
function val(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string") return node;
  if (typeof node === "object" && "#text" in (node as object)) return String((node as { "#text": unknown })["#text"]);
  if (typeof node === "number") return String(node);
  return null;
}

export function istERechnungXml(xml: string): "CII" | "UBL" | null {
  if (/CrossIndustryInvoice/.test(xml)) return "CII";
  if (/<([a-zA-Z]+:)?Invoice[\s>]/.test(xml) && /oasis.*ubl|InvoiceLine/.test(xml)) return "UBL";
  return null;
}

export function parseERechnungXml(xml: string): ParsedInvoice | null {
  const typ = istERechnungXml(xml);
  if (!typ) return null;
  const doc = parser.parse(xml);
  return typ === "CII" ? parseCII(doc) : parseUBL(doc);
}

function parseCII(doc: any): ParsedInvoice {
  const root = doc.CrossIndustryInvoice ?? doc;
  const head = root.ExchangedDocument ?? {};
  const tx = root.SupplyChainTradeTransaction ?? {};
  const agreement = tx.ApplicableHeaderTradeAgreement ?? {};
  const settlement = tx.ApplicableHeaderTradeSettlement ?? {};

  const nummer = val(head.ID);
  const datumStr = val(head.IssueDateTime?.DateTimeString) ?? val(head.IssueDateTime);
  const datum = datumStr ? (datumStr.length === 8 ? parseDatum(`${datumStr.slice(0,4)}-${datumStr.slice(4,6)}-${datumStr.slice(6,8)}`) : parseDatum(datumStr)) : null;

  const seller = agreement.SellerTradeParty ?? {};
  const sellerName = val(seller.Name);
  const ustIdNr =
    asArray(seller.SpecifiedTaxRegistration).map((r: any) => val(r.ID)).find(Boolean) ?? null;

  const summe = settlement.SpecifiedTradeSettlementHeaderMonetarySummation ?? {};
  const nettoSumme = parseBetrag(val(summe.TaxBasisTotalAmount) ?? "");
  const mwstSumme = parseBetrag(val(summe.TaxTotalAmount) ?? "");
  const bruttoSumme = parseBetrag(val(summe.GrandTotalAmount) ?? "");

  const positionen: ParsedPosition[] = asArray(tx.IncludedSupplyChainTradeLineItem).map((li: any, i: number) => {
    const prod = li.SpecifiedTradeProduct ?? {};
    const lineAgr = li.SpecifiedLineTradeAgreement ?? {};
    const delivery = li.SpecifiedLineTradeDelivery ?? {};
    const lineSet = li.SpecifiedLineTradeSettlement ?? {};
    const preis = lineAgr.NetPriceProductTradePrice ?? lineAgr.GrossPriceProductTradePrice ?? {};
    const lineSum = lineSet.SpecifiedTradeSettlementLineMonetarySummation ?? {};
    return {
      position: Number(val(li.AssociatedDocumentLineDocument?.LineID)) || i + 1,
      artikelnummer: val(prod.SellerAssignedID) ?? val(prod.BuyerAssignedID) ?? null,
      ean: val(prod.GlobalID) ?? null,
      bezeichnung: val(prod.Name),
      menge: parseBetrag(val(delivery.BilledQuantity) ?? ""),
      einheit: (typeof delivery.BilledQuantity === "object" ? val(delivery.BilledQuantity?.["@_unitCode"]) : null),
      einzelpreis: parseBetrag(val(preis.ChargeAmount) ?? ""),
      positionsbetrag: parseBetrag(val(lineSum.LineTotalAmount) ?? ""),
    };
  });

  return { nummer, datum, lieferantName: sellerName, ustIdNr, nettoSumme, mwstSumme, bruttoSumme, positionen };
}

function parseUBL(doc: any): ParsedInvoice {
  const inv = doc.Invoice ?? doc;
  const nummer = val(inv.ID);
  const datum = parseDatum(val(inv.IssueDate) ?? "");

  const seller = inv.AccountingSupplierParty?.Party ?? {};
  const sellerName = val(seller.PartyName?.Name) ?? val(seller.PartyLegalEntity?.RegistrationName);
  const ustIdNr = asArray(seller.PartyTaxScheme).map((t: any) => val(t.CompanyID)).find(Boolean) ?? null;

  const total = inv.LegalMonetaryTotal ?? {};
  const nettoSumme = parseBetrag(val(total.TaxExclusiveAmount) ?? "");
  const bruttoSumme = parseBetrag(val(total.TaxInclusiveAmount) ?? val(total.PayableAmount) ?? "");
  const mwstSumme = parseBetrag(val(asArray(inv.TaxTotal)[0]?.TaxAmount) ?? "");

  const positionen: ParsedPosition[] = asArray(inv.InvoiceLine).map((li: any, i: number) => {
    const item = li.Item ?? {};
    const price = li.Price ?? {};
    return {
      position: Number(val(li.ID)) || i + 1,
      artikelnummer: val(item.SellersItemIdentification?.ID) ?? null,
      ean: val(item.StandardItemIdentification?.ID) ?? null,
      bezeichnung: val(item.Name),
      menge: parseBetrag(val(li.InvoicedQuantity) ?? ""),
      einheit: (typeof li.InvoicedQuantity === "object" ? val(li.InvoicedQuantity?.["@_unitCode"]) : null),
      einzelpreis: parseBetrag(val(price.PriceAmount) ?? ""),
      positionsbetrag: parseBetrag(val(li.LineExtensionAmount) ?? ""),
    };
  });

  return { nummer, datum, lieferantName: sellerName, ustIdNr, nettoSumme, mwstSumme, bruttoSumme, positionen };
}
