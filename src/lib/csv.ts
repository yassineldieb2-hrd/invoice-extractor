import type { Invoice } from "./schema";

// Cells starting with these characters can run as formulas in Excel/Sheets.
// Prefix them with a quote so untrusted document text stays plain text.
function cell(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && typeof value === "string") s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/** One row per line item; invoice-level fields repeat on every row. */
export function invoiceToCsv(inv: Invoice, sourceFile: string): string {
  const header = [
    "source_file", "vendor", "invoice_number", "date", "currency",
    "line_description", "quantity", "unit_price", "line_amount",
    "subtotal", "vat_rate_percent", "vat_amount", "total",
  ];
  const base = (li: Invoice["lineItems"][number] | null) => [
    sourceFile, inv.vendor, inv.invoiceNumber, inv.date, inv.currency,
    li?.description ?? "", li?.quantity ?? null, li?.unitPrice ?? null, li?.amount ?? null,
    inv.subtotal, inv.vatRate, inv.vatAmount, inv.total,
  ];
  const rows = inv.lineItems.length ? inv.lineItems.map(base) : [base(null)];
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}