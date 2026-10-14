"use client";

import { useEffect, useState } from "react";
import type { Invoice, Issue, LineItem } from "@/lib/schema";
import { SAMPLE_BAD, SAMPLE_OK, useExtractor } from "./ExtractorContext";
import { Reveal } from "./Reveal";

const num = (v: string): number | null => {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const money = (n: number | null | undefined) => (n === null || n === undefined ? "--" : n.toFixed(2));

const EMPTY: Invoice = {
  vendor: null,
  invoiceNumber: null,
  date: null,
  currency: null,
  lineItems: [],
  subtotal: null,
  vatRate: null,
  vatAmount: null,
  total: null,
};

export default function Workbench() {
  const {
    status,
    busy,
    invoice,
    setInvoice,
    issues,
    preview,
    error,
    runId,
    copied,
    handleFile,
    loadSample,
    openPicker,
    downloadCsv,
    copyJson,
  } = useExtractor();
  const [dragging, setDragging] = useState(false);

  const live = invoice !== null;
  const inv = invoice ?? EMPTY;
  // The original file while it is being read; the rebuilt document once results land.
  const view: "source" | "parsed" = busy || !invoice ? "source" : "parsed";

  const flagged = new Set(issues.map((i) => i.field));
  const isFlag = (f: string) => flagged.has(f);

  const set = <K extends keyof Invoice>(key: K, value: Invoice[K]) =>
    setInvoice((v) => (v ? { ...v, [key]: value } : v));
  const setLine = (i: number, patch: Partial<LineItem>) =>
    setInvoice((v) => (v ? { ...v, lineItems: v.lineItems.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) } : v));
  const addLine = () =>
    setInvoice((v) =>
      v ? { ...v, lineItems: [...v.lineItems, { description: "", quantity: null, unitPrice: null, amount: null }] } : v,
    );
  const removeLine = (i: number) =>
    setInvoice((v) => (v ? { ...v, lineItems: v.lineItems.filter((_, idx) => idx !== i) } : v));

  const metaInput = "w-full bg-transparent font-body-md text-body-md focus:outline-none disabled:text-outline pr-3";
  const flagCell = (f: string) => (isFlag(f) ? " outline outline-1 outline-warn/70 bg-warn/10" : "");

  return (
    <section id="workbench" className="scroll-mt-20 w-full px-4 sm:px-margin py-space-xl bg-surface">
      {/* Section Indicator */}
      <Reveal className="relative flex flex-wrap gap-space-sm items-center justify-between pb-space-sm mb-space-lg">
        <span aria-hidden className="rule-draw absolute left-0 right-0 bottom-0 h-px bg-outline-variant/60" />
        <div className="flex items-center gap-space-sm">
          <span className="w-3 h-3 bg-primary" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wide max-sm:text-[17px]">
            Try it on an invoice
          </h2>
        </div>
      </Reveal>

      {/* Drag & Drop Upload Portal */}
      <div
        onClick={() => !busy && openPicker()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`relative w-full p-space-lg mb-space-lg transition-all duration-200 cursor-pointer group hover:bg-surface-container-low ${dragging ? "bg-surface-container-high outline outline-1 outline-primary-container" : "bg-surface-container-lowest"}`}
      >
        <div className="flex flex-col items-center justify-center text-center py-space-md">
          <div className="w-12 h-12 mb-space-sm flex items-center justify-center bg-surface-container text-primary rounded-none group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">document_scanner</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs uppercase">
            {busy ? "READING THE DOCUMENT" : dragging ? "RELEASE TO UPLOAD" : "Drop an invoice PDF or image"}
            {busy && <span className="caret" />}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md max-w-lg">
            PDF, JPG, PNG, WebP or GIF, up to 4 MB. Gemini reads the file, so use samples or non-confidential documents.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-space-sm" onClick={(e) => e.stopPropagation()}>
            <button
              className="px-space-md py-space-xs bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors bloom disabled:opacity-40"
              type="button"
              disabled={busy}
              onClick={openPicker}
            >
              CHOOSE FILE
            </button>
            <button
              className="px-space-md py-space-xs bg-surface-container text-on-surface font-label-md text-label-md hover:text-primary transition-colors disabled:opacity-40"
              type="button"
              disabled={busy}
              onClick={() => loadSample(SAMPLE_OK)}
            >
              SAMPLE: 14-LINE INVOICE
            </button>
            <button
              className="px-space-md py-space-xs bg-surface-container text-on-surface font-label-md text-label-md hover:text-primary transition-colors disabled:opacity-40"
              type="button"
              disabled={busy}
              onClick={() => loadSample(SAMPLE_BAD)}
            >
              SAMPLE: INVOICE WITH ERRORS
            </button>
          </div>
          <p className="mt-space-sm font-label-sm text-label-sm text-outline">8 free extractions per day</p>
        </div>
      </div>

      {status === "error" && (
        <div role="alert" className="mb-space-lg px-space-md py-space-sm bg-error-container/30 text-error font-body-sm text-body-sm">
          <span className="font-label-sm text-label-sm font-bold">ERR&gt; </span>
          {error}
        </div>
      )}

      {/* DUAL PANE WORKBENCH */}
      <div className="grid grid-cols-12 gap-gutter items-start">
        {/* LEFT PANE: Document preview */}
        <div className="col-span-12 xl:col-span-5 bg-surface-container-lowest p-space-md min-w-0">
          <div className="flex flex-wrap gap-space-xs items-center justify-between pb-space-sm mb-space-md">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm min-w-0">
              <span className="w-2 h-2 bg-primary shrink-0" />
              <span className="text-on-surface font-bold truncate">Document</span>
            </div>
          </div>

          {view === "source" && preview ? (
            <div className="relative w-full bg-surface-container overflow-hidden h-[420px] sm:h-[460px]">
              {preview.type === "application/pdf" ? (
                <iframe title="Uploaded PDF preview" src={preview.url} className="h-full w-full bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="Uploaded invoice preview" className="h-full w-full object-contain" />
              )}
              {busy && (
                <div className="scan-sweep absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
            </div>
          ) : (
            <ParsedDoc key={runId} inv={inv} live={live} flagged={flagged} busy={busy} />
          )}

        </div>

        {/* RIGHT PANE: Structured JSON matrix */}
        <div className="col-span-12 xl:col-span-7 bg-surface-container-lowest p-space-md min-w-0">
          <div className="flex flex-wrap items-center justify-between pb-space-sm mb-space-md gap-space-sm">
            <div className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm">
              <span className="w-2 h-2 bg-secondary" />
              <span className="text-on-surface font-bold">Extracted data</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-sm py-1 bg-surface-container font-label-sm text-label-sm text-on-surface hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-40"
                type="button"
                disabled={!live}
                onClick={addLine}
              >
                + Add line
              </button>
            </div>
          </div>

          <ResultSummary key={`${runId}-${issues.length === 0}`} live={live} busy={busy} failed={status === "error"} issues={issues} />

          {/* Metadata Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-xs mb-space-md">
            <label className={`term bg-surface-container p-space-xs${flagCell("vendor")}`}>
              <span className="font-label-sm text-label-sm text-outline block">Vendor</span>
              <input
                className={`${metaInput} text-primary font-bold`}
                disabled={!live}
                placeholder="--"
                type="text"
                value={inv.vendor ?? ""}
                onChange={(e) => set("vendor", e.target.value || null)}
              />
            </label>
            <label className="term bg-surface-container p-space-xs">
              <span className="font-label-sm text-label-sm text-outline block">Invoice number</span>
              <input
                className={`${metaInput} text-on-surface font-bold`}
                disabled={!live}
                placeholder="--"
                type="text"
                value={inv.invoiceNumber ?? ""}
                onChange={(e) => set("invoiceNumber", e.target.value || null)}
              />
            </label>
            <label className={`term bg-surface-container p-space-xs${flagCell("date")}`}>
              <span className="font-label-sm text-label-sm text-outline block">Date</span>
              <input
                className={`${metaInput} text-on-surface`}
                disabled={!live}
                placeholder="YYYY-MM-DD"
                type="text"
                value={inv.date ?? ""}
                onChange={(e) => set("date", e.target.value || null)}
              />
            </label>
            <label className={`term bg-surface-container p-space-xs${flagCell("currency")}`}>
              <span className="font-label-sm text-label-sm text-outline block">Currency</span>
              <input
                className={`${metaInput} text-on-surface`}
                disabled={!live}
                placeholder="--"
                type="text"
                value={inv.currency ?? ""}
                onChange={(e) => set("currency", e.target.value.toUpperCase() || null)}
              />
            </label>
          </div>

          {/* Editable Line Items Table */}
          <div className="overflow-x-auto mb-space-md">
            <table className="w-full min-w-[560px] text-left font-body-md text-body-md border-collapse">
              <thead>
                <tr className="font-label-sm text-label-sm text-outline uppercase bg-surface-container-low">
                  <th className="py-space-xs px-space-sm">DESCRIPTION</th>
                  <th className="py-space-xs px-space-sm w-12">QTY</th>
                  <th className="py-space-xs px-space-sm w-20">UNIT PRICE</th>
                  <th className="py-space-xs px-space-sm w-20">AMOUNT</th>
                  <th className="py-space-xs px-space-sm w-14">STATE</th>
                  <th className="py-space-xs px-space-sm w-8" />
                </tr>
              </thead>
              <tbody key={runId} className="divide-y divide-outline-variant/30">
                {!live && (
                  <tr>
                    <td colSpan={6} className="py-space-sm px-space-sm text-outline">
                      {busy ? (
                        <span className="caret">
                          Waiting for the model...
                        </span>
                      ) : status === "error" ? (
                        "Nothing extracted."
                      ) : (
                        "No data yet. Load a sample or drop a file."
                      )}
                    </td>
                  </tr>
                )}
                {inv.lineItems.map((li, i) => {
                  const bad = flagged.has(`lineItems.${i}.amount`);
                  const checkable = li.quantity !== null && li.unitPrice !== null && li.amount !== null;
                  return (
                    <tr
                      key={i}
                      className={`row-in hover:bg-surface-container transition-colors group ${bad ? "bg-warn/10" : ""}`}
                      style={{ animationDelay: `${i * 140}ms` }}
                    >
                      <td className="py-space-xs px-space-sm term">
                        <input
                          aria-label={`Line ${i + 1} description`}
                          title={li.description}
                          className="w-full bg-transparent text-on-surface focus:outline-none focus:text-primary pr-3"
                          type="text"
                          value={li.description}
                          onChange={(e) => setLine(i, { description: e.target.value })}
                        />
                      </td>
                      <td className="py-space-xs px-space-sm term">
                        <input
                          aria-label={`Line ${i + 1} quantity`}
                          className="w-full bg-transparent text-on-surface text-right focus:outline-none focus:text-primary pr-3"
                          inputMode="decimal"
                          type="text"
                          value={li.quantity ?? ""}
                          onChange={(e) => setLine(i, { quantity: num(e.target.value) })}
                        />
                      </td>
                      <td className="py-space-xs px-space-sm term">
                        <input
                          aria-label={`Line ${i + 1} unit price`}
                          className="w-full bg-transparent text-on-surface text-right focus:outline-none focus:text-primary pr-3"
                          inputMode="decimal"
                          type="text"
                          value={li.unitPrice ?? ""}
                          onChange={(e) => setLine(i, { unitPrice: num(e.target.value) })}
                        />
                      </td>
                      <td className="py-space-xs px-space-sm term">
                        <input
                          aria-label={`Line ${i + 1} amount`}
                          className={`w-full bg-transparent text-right font-bold focus:outline-none pr-3 ${bad ? "text-warn" : "text-primary"}`}
                          inputMode="decimal"
                          type="text"
                          value={li.amount ?? ""}
                          onChange={(e) => setLine(i, { amount: num(e.target.value) })}
                        />
                      </td>
                      <td className="py-space-xs px-space-sm">
                        <span
                          className={`font-label-sm text-label-sm px-1 ${bad ? "bg-warn text-surface-container-lowest" : checkable ? "bg-surface-container text-secondary" : "bg-surface-container text-outline"}`}
                        >
                          {bad ? "FLAG" : checkable ? "OK" : "SKIP"}
                        </span>
                      </td>
                      <td className="py-space-xs px-space-sm text-center">
                        <button
                          className="text-outline hover:text-error transition-colors"
                          type="button"
                          aria-label={`Remove line ${i + 1}`}
                          onClick={() => removeLine(i)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-space-sm pb-space-sm bg-surface-container-low p-space-sm mb-space-md">
            <div className="w-full md:w-80 shrink-0 space-y-1 text-right font-body-md text-body-md">
              <div className={`term flex justify-between items-center text-on-surface-variant${flagCell("subtotal")}`}>
                <span>Subtotal</span>
                <input
                  aria-label="Subtotal"
                  className="w-28 bg-transparent text-right font-bold text-on-surface focus:outline-none pr-3 disabled:text-outline"
                  disabled={!live}
                  placeholder="--"
                  inputMode="decimal"
                  value={inv.subtotal ?? ""}
                  onChange={(e) => set("subtotal", num(e.target.value))}
                />
              </div>
              <div className={`term flex justify-between items-center text-on-surface-variant${flagCell("vatAmount")}`}>
                <span className="flex items-center">
                  VAT (
                  <input
                    aria-label="VAT rate percent"
                    className="w-10 bg-transparent text-center text-on-surface focus:outline-none disabled:text-outline"
                    disabled={!live}
                    placeholder="--"
                    inputMode="decimal"
                    value={inv.vatRate ?? ""}
                    onChange={(e) => set("vatRate", num(e.target.value))}
                  />
                  %)
                </span>
                <input
                  aria-label="VAT amount"
                  className="w-28 bg-transparent text-right font-bold text-on-surface focus:outline-none pr-3 disabled:text-outline"
                  disabled={!live}
                  placeholder="--"
                  inputMode="decimal"
                  value={inv.vatAmount ?? ""}
                  onChange={(e) => set("vatAmount", num(e.target.value))}
                />
              </div>
              <div
                className={`term flex justify-between items-center text-headline-sm pt-space-xs font-bold ${isFlag("total") ? "text-warn" : "text-primary"}${flagCell("total")}`}
              >
                <span className="whitespace-nowrap">Total{inv.currency ? ` (${inv.currency})` : ""}</span>
                <input
                  aria-label="Total"
                  className="w-28 bg-transparent text-right focus:outline-none pr-3 disabled:text-outline"
                  disabled={!live}
                  placeholder="--"
                  inputMode="decimal"
                  value={inv.total ?? ""}
                  onChange={(e) => set("total", num(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-md py-space-xs bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors bloom disabled:opacity-40"
                type="button"
                disabled={!live}
                onClick={downloadCsv}
              >
                DOWNLOAD CSV
              </button>
              <button
                className="px-space-md py-space-xs bg-surface-container text-on-surface font-label-md text-label-md hover:text-primary transition-colors disabled:opacity-40"
                type="button"
                disabled={!live}
                onClick={copyJson}
              >
                {copied ? "COPIED" : "COPY JSON"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* The mockup's simulated document, filled from the extracted data (or placeholders before a run). */
function ParsedDoc({ inv, live, flagged, busy }: { inv: Invoice; live: boolean; flagged: Set<string>; busy: boolean }) {
  const rows = live ? inv.lineItems : [];
  return (
    <div className="relative w-full bg-surface-container p-space-md overflow-hidden select-none">
      {/* Document Header */}
      <div className="flex flex-wrap gap-space-sm justify-between items-start mb-space-lg">
        <div className="min-w-0">
          <span className="font-label-sm text-label-sm text-primary block">Vendor</span>
          <div className={`font-headline-sm text-headline-sm font-bold ${flagged.has("vendor") ? "text-warn" : "text-on-surface"}`}>
            {live ? inv.vendor || "(MISSING)" : "NO DOCUMENT LOADED"}
          </div>
          {!live && (
            <p className="font-body-sm text-body-sm text-outline">
              Drop a file or load a sample.
              <br />
              The extracted fields appear here.
            </p>
          )}
        </div>
        <div className="sm:text-right">
          <span className="font-label-sm text-label-sm text-outline block">Invoice number</span>
          <span className="font-label-md text-label-md text-primary font-bold">{live ? inv.invoiceNumber || "--" : "--"}</span>
          <span className={`font-body-sm text-body-sm block mt-1 ${flagged.has("date") ? "text-warn" : "text-outline"}`}>
            Date: {live ? inv.date || "--" : "--"}
          </span>
        </div>
      </div>
      {/* Line rows with highlight overlays */}
      <div className="relative py-space-sm mb-space-md">
        <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2">
          {live
            ? rows.map((li, i) => {
                const bad = flagged.has(`lineItems.${i}.amount`);
                const mark = bad;
                return (
                  <div key={i} className="row-in relative" style={{ animationDelay: `${i * 140}ms` }}>
                    {mark && (
                      <div
                        className={`absolute -inset-x-2 -inset-y-1.5 pointer-events-none ${bad ? "bg-warn/15" : "bg-primary/10"}`}
                      />
                    )}
                    <div className="relative flex justify-between gap-space-sm">
                      <span className="truncate">
                        {i + 1}. {li.description || "(no description)"}
                      </span>
                      <span className={`font-bold shrink-0 ${bad ? "text-warn" : "text-on-surface"}`}>{money(li.amount)}</span>
                    </div>
                  </div>
                );
              })
            : [0, 1, 2, 3].map((k) => (
                <div key={k} className="flex justify-between">
                  <span className="text-outline-variant">{k + 1}. ····························</span>
                  <span className="text-outline-variant font-bold">--</span>
                </div>
              ))}
        </div>
      </div>
      {/* Document Footer */}
      <div className="pt-space-sm flex justify-between font-body-sm text-body-sm">
        <span className="text-outline">
          Subtotal: {live ? money(inv.subtotal) : "--"}
          <br />
          VAT{live && inv.vatRate !== null ? ` (${inv.vatRate}%)` : ""}: {live ? money(inv.vatAmount) : "--"}
        </span>
        <div className="text-right">
          <span className="text-outline block">Total due{live && inv.currency ? ` (${inv.currency})` : ""}</span>
          <span className={`font-headline-sm text-headline-sm font-bold ${flagged.has("total") ? "text-warn" : "text-primary"}`}>
            {live ? money(inv.total) : "--"}
          </span>
        </div>
      </div>
      {busy && (
        <div className="scan-sweep absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
    </div>
  );
}

/* Plain-words label for the field an issue points at, so the eye can find the highlighted cell. */
function fieldLabel(field: string) {
  const m = /^lineItems\.(\d+)\.amount$/.exec(field);
  if (m) return `Line ${Number(m[1]) + 1} amount`;
  return (
    {
      vendor: "Vendor",
      total: "Total",
      subtotal: "Subtotal",
      vatAmount: "VAT amount",
      date: "Issue date",
      currency: "Currency",
      lineItems: "Line items",
    } as Record<string, string>
  )[field] ?? field;
}

/* Counts up from 0 to n once, quickly. Shows n at once when motion is reduced. */
function CountUp({ n }: { n: number }) {
  const [shown, setShown] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? n : 0,
  );
  useEffect(() => {
    if (shown === n) return;
    const id = setInterval(() => {
      setShown((v) => (v < n ? v + 1 : v > n ? v - 1 : v));
    }, Math.max(40, 360 / Math.max(1, n)));
    return () => clearInterval(id);
  }, [n, shown]);
  return <span className="tabular-nums">{shown}</span>;
}

/* One plain summary line at the top of the results, then the issues as short sentences. */
function ResultSummary({
  live,
  busy,
  failed,
  issues,
}: {
  live: boolean;
  busy: boolean;
  failed: boolean;
  issues: Issue[];
}) {
  if (!live) {
    return (
      <div className="mb-space-md p-space-sm bg-surface-container-low">
        <div className={`font-headline-sm text-headline-sm uppercase font-bold ${busy ? "text-primary" : "text-outline"}`}>
          {busy ? (
            <span className="caret">READING THE DOCUMENT</span>
          ) : failed ? (
            "Nothing extracted."
          ) : (
            "WAITING FOR A DOCUMENT"
          )}
        </div>
      </div>
    );
  }
  const n = issues.length;
  const hasErrors = issues.some((i) => i.severity === "error");
  const tone = n === 0 ? "text-primary" : hasErrors ? "text-error" : "text-warn";
  const bar = n === 0 ? "bg-primary-container" : hasErrors ? "bg-error" : "bg-warn";
  return (
    <div className="mb-space-md p-space-sm bg-surface-container-low" aria-live="polite">
      <div className={`led-flicker font-headline-md text-headline-md uppercase font-bold ${tone} max-sm:text-[24px]`}>
        {n === 0 ? (
          "ALL CHECKS PASSED"
        ) : (
          <>
            <CountUp n={n} /> {n === 1 ? "THING" : "THINGS"} TO FIX
          </>
        )}
      </div>
      <div className="h-0.5 mt-space-xs mb-space-sm bg-surface-container overflow-hidden">
        <div className={`bar-fill h-full ${bar}`} />
      </div>
      {n === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Lines, subtotal, VAT and total agree. Give the fields a quick look, then export.
        </p>
      ) : (
        <ul className="space-y-1 font-body-md text-body-md">
          {issues.map((i, k) => (
            <li key={k} className="row-in text-on-surface" style={{ animationDelay: `${k * 110}ms` }}>
              <span className={`font-bold ${i.severity === "error" ? "text-error" : "text-warn"}`}>{fieldLabel(i.field)}:</span>{" "}
              {i.message.replace(/^Line \d+: /, "")}
            </li>
          ))}
          <li className="pt-1 font-body-sm text-body-sm text-outline">Fix the highlighted fields. The checks re-run as you type.</li>
        </ul>
      )}
    </div>
  );
}
