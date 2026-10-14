import type { Invoice, Issue } from "./schema";

const TOLERANCE = 0.02; // allow rounding differences of up to 2 cents

const close = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE;
const fmt = (n: number) => n.toFixed(2);

/**
 * Checks the arithmetic and completeness of an extracted invoice.
 * Pure function: no network, easy to test. The LLM reads the document;
 * this code decides whether the numbers add up.
 */
export function validateInvoice(inv: Invoice): Issue[] {
  const issues: Issue[] = [];

  // --- completeness ---
  if (!inv.vendor?.trim()) issues.push({ severity: "warning", field: "vendor", message: "Vendor is missing." });
  if (inv.total === null) issues.push({ severity: "error", field: "total", message: "Total is missing." });
  if (inv.lineItems.length === 0) issues.push({ severity: "warning", field: "lineItems", message: "No line items found." });

  if (inv.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(inv.date)) {
    issues.push({ severity: "warning", field: "date", message: "Date is not in YYYY-MM-DD format." });
  } else if (inv.date !== null && Number.isNaN(Date.parse(inv.date))) {
    issues.push({ severity: "warning", field: "date", message: "Date is not a valid calendar date." });
  }

  if (inv.currency !== null && !/^[A-Z]{3}$/.test(inv.currency)) {
    issues.push({ severity: "warning", field: "currency", message: "Currency should be a 3-letter code like EUR." });
  }

  // --- per-line arithmetic: quantity x unit price = amount ---
  inv.lineItems.forEach((li, i) => {
    if (li.quantity !== null && li.unitPrice !== null && li.amount !== null) {
      const expected = li.quantity * li.unitPrice;
      if (!close(expected, li.amount)) {
        issues.push({
          severity: "error",
          field: `lineItems.${i}.amount`,
          message: `Line ${i + 1}: ${li.quantity} x ${fmt(li.unitPrice)} = ${fmt(expected)}, but amount is ${fmt(li.amount)}.`,
        });
      }
    }
  });

  // --- sum of lines vs subtotal (or total when no subtotal/VAT is shown) ---
  const lineAmounts = inv.lineItems.map((l) => l.amount);
  const allLinesHaveAmount = lineAmounts.length > 0 && lineAmounts.every((a) => a !== null);
  if (allLinesHaveAmount) {
    const sum = (lineAmounts as number[]).reduce((s, a) => s + a, 0);
    const target = inv.subtotal ?? (inv.vatAmount === null ? inv.total : null);
    if (target !== null && !close(sum, target)) {
      issues.push({
        severity: "error",
        field: inv.subtotal !== null ? "subtotal" : "total",
        message: `Line items add up to ${fmt(sum)}, but the document shows ${fmt(target)}.`,
      });
    }
  }

  // --- subtotal + VAT = total ---
  if (inv.subtotal !== null && inv.vatAmount !== null && inv.total !== null) {
    const expected = inv.subtotal + inv.vatAmount;
    if (!close(expected, inv.total)) {
      issues.push({
        severity: "error",
        field: "total",
        message: `Subtotal ${fmt(inv.subtotal)} + VAT ${fmt(inv.vatAmount)} = ${fmt(expected)}, but total is ${fmt(inv.total)}.`,
      });
    }
  }

  // --- VAT rate vs VAT amount (looser: invoices with mixed rates are common) ---
  if (inv.subtotal !== null && inv.vatAmount !== null && inv.vatRate !== null) {
    const expectedVat = (inv.subtotal * inv.vatRate) / 100;
    if (Math.abs(expectedVat - inv.vatAmount) > Math.max(TOLERANCE, inv.subtotal * 0.005)) {
      issues.push({
        severity: "warning",
        field: "vatAmount",
        message: `${inv.vatRate}% of ${fmt(inv.subtotal)} is ${fmt(expectedVat)}, but VAT is ${fmt(inv.vatAmount)}. This can be normal with mixed VAT rates.`,
      });
    }
  }

  return issues;
} 