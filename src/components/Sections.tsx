"use client";

import LedDisplay from "./LedDisplay";
import { Reveal, useScrolled } from "./Reveal";
import { SAMPLE_BAD, SAMPLE_OK, useExtractor } from "./ExtractorContext";

/* Stand-in for the mockup's round logo image: a small phosphor dot grid. */
function DotMark() {
  const on = [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1];
  return (
    <span aria-hidden className="w-8 h-8 rounded-full bg-surface-container-lowest grid grid-cols-4 gap-[2px] p-[7px] shrink-0">
      {on.map((v, i) => (
        <i key={i} className={v ? "bg-primary-container rounded-[1px]" : "bg-on-primary-container/40 rounded-[1px]"} />
      ))}
    </span>
  );
}

const scrollToBench = () => document.getElementById("workbench")?.scrollIntoView({ behavior: "smooth" });

/* ================= HEADER ================= */
export function Header() {
  const { busy, invoice, loadSample, downloadCsv } = useExtractor();
  const scrolled = useScrolled();
  return (
    <header
      className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-[background-color,border-color,box-shadow] duration-300 ${scrolled ? "bg-surface-container-lowest/85 backdrop-blur-lg border-outline-variant/50 shadow-[0_8px_24px_rgba(0,0,0,0.35)]" : "bg-surface-container-lowest/95 border-transparent"}`}
    >
      <div className="h-16 w-full px-4 sm:px-margin flex items-center justify-between gap-gutter">
        <a href="#top" className="flex items-center gap-space-sm min-w-0">
          <DotMark />
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-primary tracking-wider whitespace-nowrap max-sm:text-[15px] max-sm:tracking-normal leading-tight">
              INVOICE.EXTRACTOR
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">by Yassin Eldeib</span>
          </div>
        </a>
        <div className="flex items-center gap-space-sm shrink-0 whitespace-nowrap">
          <button
            className="px-space-md py-space-xs bg-surface-container font-label-md text-label-md text-on-surface hover:text-primary transition-colors disabled:opacity-50 max-sm:px-space-sm"
            type="button"
            disabled={busy}
            onClick={() => {
              scrollToBench();
              void loadSample(SAMPLE_OK);
            }}
          >
            <span className="sm:hidden">SAMPLE</span>
            <span className="hidden sm:inline">LOAD SAMPLE INVOICE</span>
          </button>
          <button
            className="px-space-md py-space-xs bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors bloom max-sm:px-space-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-none"
            type="button"
            disabled={!invoice}
            title={invoice ? "Download the extracted data as CSV" : "Available once an invoice has been extracted"}
            onClick={downloadCsv}
          >
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">EXPORT CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ================= HERO ================= */
export function Hero() {
  const { led, busy, status, issues, invoice, error, loadSample, openPicker } = useExtractor();
  const n = issues.length;
  const line =
    status === "reading"
      ? "Reading the document..."
      : status === "checking"
        ? "Checking the maths..."
        : status === "error"
          ? error || "Something went wrong. Try again."
          : status === "done" && invoice
            ? n === 0
              ? "All checks passed."
              : `${n} ${n === 1 ? "thing" : "things"} to fix. See the results below.`
            : "Ready. Drop an invoice below.";
  const lineColor =
    status === "error" || (status === "done" && led.tone === "bad")
      ? "text-error"
      : status === "done" && led.tone === "warn"
        ? "text-warn"
        : "text-on-surface-variant";
  return (
    <section className="relative w-full px-4 sm:px-margin pt-space-xl pb-space-xl bg-surface-container-lowest overflow-hidden">
      {/* Ambient phosphor grid background SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="32" id="telemetry-grid" patternUnits="userSpaceOnUse" width="32">
              <circle cx="2" cy="2" fill="#4ade80" r="1" />
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#22c55e" strokeOpacity="0.2" strokeWidth="0.35" />
            </pattern>
          </defs>
          <rect fill="url(#telemetry-grid)" height="100%" width="100%" />
        </svg>
      </div>
      {/* Hero Content Grid */}
      <div className="relative z-10 grid grid-cols-12 gap-gutter items-center">
        {/* Left Hero Terminal */}
        <div className="col-span-12 xl:col-span-7 flex flex-col justify-between pr-0 xl:pr-space-lg">
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile sm:font-headline-xl sm:text-headline-xl text-on-surface uppercase tracking-tight mb-space-md font-extrabold leading-none sm:leading-none">
            <span className="sr-only">Checked invoice extraction</span>
            {/* One highlight block per visual line: identical height, padding and left edge. */}
            <span aria-hidden className="hl-title">
              <span className="hl-row">
                <span className="hl">CHECKED</span>
              </span>
              <span className="hl-row hidden md:block">
                <span className="hl hl-2">INVOICE EXTRACTION</span>
              </span>
              <span className="hl-row md:hidden">
                <span className="hl hl-2">INVOICE</span>
              </span>
              <span className="hl-row md:hidden">
                <span className="hl hl-3">EXTRACTION</span>
              </span>
            </span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-xl leading-relaxed">
            Upload an invoice. Gemini reads it, code checks the maths, you fix what is flagged and export a CSV.
          </p>
          {/* CTA Action Cluster */}
          <div className="flex flex-wrap items-center gap-space-md">
            <button
              className="group relative px-space-lg py-space-sm bg-surface-container-lowest text-primary font-label-md text-label-md tracking-wider uppercase transition-all duration-150 hover:bg-primary hover:text-surface-container-lowest bloom"
              type="button"
              onClick={() => {
                scrollToBench();
                openPicker();
              }}
            >
              <span className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-base">terminal</span>
                <span>UPLOAD INVOICE</span>
                <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
            <button
              className="group px-space-lg py-space-sm bg-surface-container-low text-on-surface font-label-md text-label-md tracking-wider uppercase hover:text-primary transition-colors disabled:opacity-50"
              type="button"
              disabled={busy}
              onClick={() => {
                scrollToBench();
                void loadSample(SAMPLE_BAD);
              }}
            >
              <span className="flex items-center gap-space-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>TRY SAMPLE WITH ERRORS</span>
              </span>
            </button>
          </div>
        </div>
        {/* Right Column: LED Dot-Matrix Display Board */}
        <div className="col-span-12 xl:col-span-5 flex flex-col justify-center">
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-2xl relative">
            <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1 overflow-x-auto">
              <div key={led.text} className="led-flicker grid gap-1 p-2 w-full justify-items-center bg-black/80 rounded">
                <LedDisplay text={led.text} tone={led.tone} busy={busy} />
              </div>
            </div>
            <p aria-live="polite" className={`mt-space-sm px-space-sm font-body-md text-body-md ${lineColor}`}>
              {line}
              {busy && <span className="caret" />}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= BUILT BY ================= */
export function BuiltBy() {
  return (
    <section id="about" className="scroll-mt-20 w-full px-4 sm:px-margin pt-0 pb-space-xl bg-surface">
      <Reveal className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-md bg-surface-container-lowest outline outline-1 outline-outline-variant/40 -outline-offset-1">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase font-bold">Built by Yassin Eldeib</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            AI engineering student in Warsaw. This invoice extractor is a portfolio project.
          </p>
        </div>
        <a
          href="https://github.com/yassineldieb2-hrd"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start md:self-auto px-space-lg py-space-sm bg-surface-container-lowest text-primary font-label-md text-label-md tracking-wider uppercase outline outline-1 outline-primary-container -outline-offset-1 transition-all duration-150 hover:bg-primary hover:text-surface-container-lowest bloom whitespace-nowrap"
        >
          GITHUB: YASSINELDIEB2-HRD →
        </a>
      </Reveal>
    </section>
  );
}

/* ================= FOOTER ================= */
export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest">
      <p className="w-full px-4 sm:px-margin py-space-sm font-body-sm text-body-sm text-outline">
        Invoice Extractor, a portfolio project by Yassin Eldeib. Files are sent to Google Gemini and not stored by this
        app. Accuracy not benchmarked yet, review flagged fields.
      </p>
    </footer>
  );
}
