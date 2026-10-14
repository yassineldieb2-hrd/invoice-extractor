import { test } from "node:test";
import assert from "node:assert/strict";
import { validateInvoice } from "../src/lib/validate.ts";
import { invoiceToCsv } from "../src/lib/csv.ts";
import type { Invoice } from "../src/lib/schema.ts";

const good: Invoice = {
  vendor: "Acme Sp. z o.o.", invoiceNumber: "FV/1", date: "2026-10-01", currency: "PLN",
  lineItems: [
    { description: "Widget", quantity: 2, unitPrice: 50, amount: 100 },
    { description: "Service", quantity: 1, unitPrice: 20, amount: 20 },
  ],
  subtotal: 120, vatRate: 23, vatAmount: 27.6, total: 147.6,
};

test("consistent invoice has no issues", () => {
  assert.deepEqual(validateInvoice(good), []);
});

test("flags wrong total", () => {
  const issues = validateInvoice({ ...good, total: 150 });
  assert.ok(issues.some((i) => i.field === "total" && i.severity === "error"));
});

test("flags lines that do not add up to subtotal", () => {
  const issues = validateInvoice({ ...good, subtotal: 130, total: 157.6 });
  assert.ok(issues.some((i) => i.field === "subtotal"));
});

test("flags qty x price mismatch", () => {
  const bad = { ...good, lineItems: [{ description: "Widget", quantity: 2, unitPrice: 50, amount: 90 }, good.lineItems[1]] };
  assert.ok(validateInvoice(bad).some((i) => i.field === "lineItems.0.amount"));
});

test("missing total and vendor are reported", () => {
  const issues = validateInvoice({ ...good, total: null, vendor: null });
  assert.ok(issues.some((i) => i.field === "total"));
  assert.ok(issues.some((i) => i.field === "vendor"));
});

test("rounding within 2 cents is accepted", () => {
  assert.deepEqual(validateInvoice({ ...good, total: 147.61 }), []);
});

test("csv escapes quotes/commas and neutralises formulas", () => {
  const csv = invoiceToCsv({ ...good, vendor: '=HYPERLINK("x")', lineItems: [{ description: "a, b", quantity: 1, unitPrice: 1, amount: 1 }] }, "f.pdf");
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes('"a, b"'));
});
