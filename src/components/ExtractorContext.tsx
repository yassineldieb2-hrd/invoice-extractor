"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Invoice, Issue } from "@/lib/schema";
import { validateInvoice } from "@/lib/validate";
import { invoiceToCsv } from "@/lib/csv";
import { countChecks } from "@/lib/checks";
import type { LedTone } from "./LedDisplay";

export const MAX_BYTES = 4 * 1024 * 1024;
export const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/gif";
export const DAILY_LIMIT = 8;
export const SAMPLE_OK = "sample-invoice-large.pdf";
export const SAMPLE_BAD = "sample-invoice-with-error.pdf";

export type Status = "idle" | "reading" | "checking" | "done" | "error";

type Ctx = {
  status: Status;
  busy: boolean;
  invoice: Invoice | null;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  issues: Issue[];
  checks: ReturnType<typeof countChecks> | null;
  file: { name: string; size: number; type: string } | null;
  preview: { url: string; type: string } | null;
  error: string;
  setError: (e: string) => void;
  runId: number;
  elapsedMs: number | null;
  led: { text: string; tone: LedTone; word: string };
  copied: boolean;
  handleFile: (file: File | undefined) => Promise<void>;
  loadSample: (name: string) => Promise<void>;
  downloadCsv: () => void;
  copyJson: () => Promise<void>;
  openPicker: () => void;
};

const ExtractorCtx = createContext<Ctx | null>(null);

export function useExtractor() {
  const c = useContext(ExtractorCtx);
  if (!c) throw new Error("useExtractor must be used inside ExtractorProvider");
  return c;
}

export function ExtractorProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [file, setFile] = useState<Ctx["file"]>(null);
  const [preview, setPreview] = useState<Ctx["preview"]>(null);
  const [error, setError] = useState("");
  const [runId, setRunId] = useState(0);
  const [copied, setCopied] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const startRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = status === "reading" || status === "checking";

  // Checks re-run from the current (possibly edited) values.
  const issues = useMemo(() => (invoice ? validateInvoice(invoice) : []), [invoice]);
  const checks = useMemo(() => (invoice ? countChecks(invoice, issues) : null), [invoice, issues]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  // Live timer for the real request while the model is reading.
  useEffect(() => {
    if (status !== "reading") return;
    const id = setInterval(() => setElapsedMs(performance.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, [status]);

  const handleFile = useCallback(async (f: File | undefined) => {
    if (!f) return;
    setError("");
    setInvoice(null);
    if (f.size > MAX_BYTES) {
      setStatus("error");
      setError("File is too large. The maximum is 4 MB.");
      return;
    }
    if (!ACCEPT.split(",").includes(f.type)) {
      setStatus("error");
      setError("Unsupported file. Upload a PDF, JPG, PNG, WebP or GIF.");
      return;
    }
    setFile({ name: f.name, size: f.size, type: f.type });
    setPreview({ url: URL.createObjectURL(f), type: f.type });
    setStatus("reading");
    startRef.current = performance.now();
    setElapsedMs(0);
    try {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/extract", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      setElapsedMs(performance.now() - startRef.current);
      if (!res.ok) throw new Error(json.error || "Extraction failed. Try again.");
      setStatus("checking");
      await new Promise((r) => setTimeout(r, 450));
      setInvoice(json.invoice as Invoice);
      setRunId((n) => n + 1);
      setStatus("done");
    } catch (e) {
      setElapsedMs(performance.now() - startRef.current);
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    }
  }, []);

  const loadSample = useCallback(
    async (name: string) => {
      try {
        const res = await fetch(`/samples/${name}`);
        const blob = await res.blob();
        await handleFile(new File([blob], name, { type: "application/pdf" }));
      } catch {
        setStatus("error");
        setError("Could not load the sample file.");
      }
    },
    [handleFile],
  );

  const downloadCsv = useCallback(() => {
    if (!invoice) return;
    const name = file?.name ?? "invoice";
    const blob = new Blob(["﻿" + invoiceToCsv(invoice, name)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (name.replace(/\.[^.]+$/, "") || "invoice") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [invoice, file]);

  const copyJson = useCallback(async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(invoice, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy. Your browser blocked clipboard access.");
    }
  }, [invoice]);

  // What the LED shows is the real state of the app.
  const hasErrors = issues.some((i) => i.severity === "error");
  let led: Ctx["led"] = { text: "IDLE", tone: "ok", word: "Idle" };
  if (status === "reading") led = { text: "READ", tone: "ok", word: "Reading" };
  else if (status === "checking") led = { text: "CHCK", tone: "ok", word: "Checking" };
  else if (status === "error") led = { text: "FAIL", tone: "bad", word: "Failed" };
  else if (status === "done")
    led =
      issues.length === 0
        ? { text: "PASS", tone: "ok", word: "Passed" }
        : { text: "FLAG", tone: hasErrors ? "bad" : "warn", word: "Flagged" };

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const value: Ctx = {
    status,
    busy,
    invoice,
    setInvoice,
    issues,
    checks,
    file,
    preview,
    error,
    setError,
    runId,
    elapsedMs,
    led,
    copied,
    handleFile,
    loadSample,
    downloadCsv,
    copyJson,
    openPicker,
  };

  return (
    <ExtractorCtx.Provider value={value}>
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </ExtractorCtx.Provider>
  );
}

export const fmtSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);
export const fmtSecs = (ms: number | null) => (ms === null ? "--" : `${(ms / 1000).toFixed(1)} s`);
