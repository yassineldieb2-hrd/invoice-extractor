import { z } from "zod";

export const LineItemSchema = z.object({
  description: z.string().describe("Item or service description as printed"),
  quantity: z.number().nullable().describe("Quantity, null if not shown"),
  unitPrice: z.number().nullable().describe("Unit price, null if not shown"),
  amount: z.number().nullable().describe("Line total as printed, null if not shown"),
});

export const InvoiceSchema = z.object({
  vendor: z.string().nullable().describe("Seller / supplier name"),
  invoiceNumber: z.string().nullable().describe("Invoice or receipt number"),
  date: z.string().nullable().describe("Issue date as YYYY-MM-DD, null if unreadable"),
  currency: z.string().nullable().describe("ISO 4217 code such as EUR, USD, PLN, AED"),
  lineItems: z.array(LineItemSchema),
  subtotal: z.number().nullable().describe("Total before VAT/tax, null if not shown"),
  vatRate: z.number().nullable().describe("VAT/tax rate in percent, e.g. 23, null if not shown"),
  vatAmount: z.number().nullable().describe("VAT/tax amount, null if not shown"),
  total: z.number().nullable().describe("Final amount due as printed"),
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;

export type Severity = "error" | "warning";
export type Issue = { severity: Severity; field: string; message: string };