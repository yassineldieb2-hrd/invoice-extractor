# Invoice Extractor

Upload an invoice (PDF or image). A vision model reads it, **plain code checks the arithmetic**, you fix whatever is flagged, then export to CSV.

**Live demo:** _add Vercel URL_ · Built by [Yassin Eldeib](https://github.com/yassineldieb2-hrd)

## How it works

1. **Upload** a PDF, JPG, PNG, WebP or GIF (up to 4 MB), or try a built-in sample.
2. **Extract**: Google Gemini reads the file and returns vendor, invoice number, date, currency, line items, subtotal, VAT rate, VAT amount and total as JSON. The output is validated against a Zod schema, and malformed output is rejected.
3. **Validate** in TypeScript, with no LLM involved (`src/lib/validate.ts`):
   - quantity x unit price = line amount
   - sum of lines = subtotal
   - subtotal + VAT = total
   - VAT rate vs VAT amount (warning only)
   - missing vendor or total, bad date format, bad currency code
   - rounding differences up to 0.02 are accepted
4. **Review and edit** every field. Checks re-run as you edit.
5. **Export** CSV (one row per line item) or copy JSON. Cells starting with `=`, `+`, `-` or `@` are prefixed with `'` to prevent spreadsheet formula injection.

## Design decisions

- **The model reads, the code checks.** The prompt tells the model to copy what is printed and never to calculate or fix numbers. A misread digit gets flagged by the validator instead of passing silently.
- **Prompt-injection aware.** Document text is treated as data, and the system prompt says to ignore instructions found inside documents.
- **The API key stays on the server** (`GEMINI_API_KEY`, read in the API route only).
- **Nothing is stored.** Files are processed in memory for the request.
- **Abuse limit.** Best-effort daily limit per visitor (default 8 extractions, `DAILY_LIMIT`). It is in memory per serverless instance, so it is not a strict guarantee. Built-in samples do not count.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, Zod, Google Gemini (`@google/genai`), Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your key
npm run dev
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Server-side Gemini key |
| `GEMINI_MODEL` | no | Model name (default `gemini-3.5-flash-lite`) |
| `DAILY_LIMIT` | no | Extractions per visitor per day (default 8) |

## Tests

```bash
npm test
```

Unit tests cover the arithmetic validation and CSV export. The model extraction itself is **not** covered by automated tests.

## Evaluation

No accuracy benchmark has been run. I manually tried the built-in samples; a harder fictional test set (multi-VAT, Polish formats, discounts, credit notes, a skewed photo, prompt injection) is being run and results will be added here once recorded.

## Known limitations

- One invoice per file. A PDF containing several invoices is not split.
- A single VAT rate field, so mixed-rate invoices only get a warning.
- The document preview is rebuilt from the extracted data, not rendered from the original file.
- The daily limit is not strict across serverless instances.
- Extraction quality depends on the model; always review flagged fields.

## Deploy

Import the repo in Vercel, set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in Project Settings > Environment Variables, and deploy. Requests are capped at 4 MB because of Vercel's request body limit.
