import type { Invoice, Issue } from "./schema";

/**
 * Counts how many checks validateInvoice actually ran for this invoice,
 * mirroring its conditions one for one. Each issue it returns comes from
 * exactly one of these checks, so passed = run - issues.
 */
export function countChecks(inv: Invoice, issues: Issue[]) {
  let run = 3; // vendor present, total present, at least one line item
  if (inv.date !== null) run += 1; // date format / calendar date
  if (inv.currency !== null) run += 1; // 3-letter currency code
  run += inv.lineItems.filter((l) => l.quantity !== null && l.unitPrice !== null && l.amount !== null).length;

  const amounts = inv.lineItems.map((l) => l.amount);
  if (amounts.length > 0 && amounts.every((a) => a !== null)) {
    const target = inv.subtotal ?? (inv.vatAmount === null ? inv.total : null);
    if (target !== null) run += 1; // sum of lines vs subtotal (or total)
  }
  if (inv.subtotal !== null && inv.vatAmount !== null && inv.total !== null) run += 1; // subtotal + VAT = total
  if (inv.subtotal !== null && inv.vatAmount !== null && inv.vatRate !== null) run += 1; // VAT rate vs amount

  const failed = Math.min(issues.length, run);
  return {
    run,
    passed: run - failed,
    failed,
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
  };
}
