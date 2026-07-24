import { describe, it, expect } from "vitest";
import { parseERechnungXml, istERechnungXml } from "./xml";

const cii = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:cii" xmlns:ram="urn:ram" xmlns:udt="urn:udt">
  <rsm:ExchangedDocument>
    <ram:ID>RE-2026-0815</ram:ID>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260315</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:SellerAssignedID>10001</ram:SellerAssignedID><ram:Name>Efendiler Oliven</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>28.50</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="H87">2</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>57.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>Musterlieferant</ram:Name><ram:SpecifiedTaxRegistration><ram:ID>DE123456789</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>57.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount>3.99</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>60.99</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

const ubl = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:cbc" xmlns:cac="urn:cac">
  <cbc:ID>RE-2026-0900</cbc:ID>
  <cbc:IssueDate>2026-04-01</cbc:IssueDate>
  <cac:AccountingSupplierParty><cac:Party>
    <cac:PartyName><cbc:Name>Lieferant AG</cbc:Name></cac:PartyName>
    <cac:PartyTaxScheme><cbc:CompanyID>DE987654321</cbc:CompanyID></cac:PartyTaxScheme>
  </cac:Party></cac:AccountingSupplierParty>
  <cac:TaxTotal><cbc:TaxAmount>2.94</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount>42.00</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount>44.94</cbc:TaxInclusiveAmount></cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="H87">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>42.00</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>Fig-S Feigen</cbc:Name><cac:SellersItemIdentification><cbc:ID>10002</cbc:ID></cac:SellersItemIdentification></cac:Item>
    <cac:Price><cbc:PriceAmount>42.00</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>`;

describe("E-Rechnung XML-Erkennung", () => {
  it("erkennt CII und UBL", () => {
    expect(istERechnungXml(cii)).toBe("CII");
    expect(istERechnungXml(ubl)).toBe("UBL");
    expect(istERechnungXml("<foo/>")).toBeNull();
  });
});

describe("CII (ZUGFeRD)", () => {
  const inv = parseERechnungXml(cii)!;
  it("Kopf", () => {
    expect(inv.nummer).toBe("RE-2026-0815");
    expect((inv.datum as Date).getFullYear()).toBe(2026);
    expect(inv.ustIdNr).toBe("DE123456789");
    expect(inv.nettoSumme).toBe(57);
    expect(inv.bruttoSumme).toBe(60.99);
  });
  it("Position", () => {
    expect(inv.positionen.length).toBe(1);
    expect(inv.positionen[0].artikelnummer).toBe("10001");
    expect(inv.positionen[0].menge).toBe(2);
    expect(inv.positionen[0].einzelpreis).toBe(28.5);
    expect(inv.positionen[0].positionsbetrag).toBe(57);
  });
});

describe("UBL (XRechnung)", () => {
  const inv = parseERechnungXml(ubl)!;
  it("Kopf + Position", () => {
    expect(inv.nummer).toBe("RE-2026-0900");
    expect(inv.ustIdNr).toBe("DE987654321");
    expect(inv.nettoSumme).toBe(42);
    expect(inv.positionen[0].artikelnummer).toBe("10002");
    expect(inv.positionen[0].einzelpreis).toBe(42);
  });
});
