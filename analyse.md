# Project Analysis — PrescriptionAI

**Generated:** 2026-08-17 (updated)
**Repo:** `prescription-analyzer`
**Type:** Full-stack web app — AI-powered medical prescription analyzer
**Stack:** Express 5 (Node/TS) backend + React 19 / Vite 8 / Tailwind 4 / shadcn/ui frontend
**Design:** Neo-brutalist style

---

## 1. What the app does

Users upload a handwritten or printed medical prescription (JPG/PNG/WEBP/PDF).
The backend:

1. Parses the document into Markdown/OCR text via **LlamaCloud** document parsing
   (agentic tier, `markdown_full` expansion).
2. Extracts structured prescription data (patient, doctor, medications, dosage,
   investigations, vitals, lifestyle advice) via a **Groq** LLM call (JSON mode,
   `llama-3.3-70b-versatile`).
3. Verifies each medicine through an **agentic tool-calling loop** that runs
   **Tavily** web searches (price, manufacturer, validity, pharmacy links) using
   `openai/gpt-oss-120b` on Groq.
4. Generates a plain-English "Patient Guide" via a second Groq call (overview,
   do/avoid lists, warning signs, questions for doctor, disclaimer).

The frontend shows the original document side-by-side with a rich dashboard
(medication table, AI insights, do/avoid lists, warning signs, pharmacy links)
and supports PDF export via `html-to-image` + `jsPDF`.

---

## 2. Project structure

```
prescription-analyzer/
├── .env                          # API keys — LLAMA, GROQ, TAVILY, BROWSERBASE, PORT, CORS_ORIGIN
├── .gitignore                    # node_modules/, dist/, .env
├── blood_sample.webp             # sample test image
├── package.json                  # backend (Express 5) — name still says "seo-tracker"
├── package-lock.json
├── tsconfig.json                 # backend TS config
├── analyse.md                    # this file
│
├── src/                          # BACKEND SOURCE
│   ├── index.ts                  # Express server entry + /upload-file endpoint
│   ├── utils/
│   │   └── ai_handler.ts         # 3-stage AI orchestration pipeline
│   └── prompts/
│       └── prescription.ts       # 3 LLM prompt templates (extract / verify / insight)
│
└── client/                       # FRONTEND (React 19 + Vite 8)
    ├── .env                      # VITE_API_URL=http://localhost:3000
    ├── .gitignore
    ├── components.json           # shadcn/ui config (base-lyra style)
    ├── eslint.config.js          # ESLint + react-hooks + react-refresh
    ├── index.html                # Vite HTML entry (title is just "client")
    ├── package.json              # frontend dependencies
    ├── package-lock.json
    ├── README.md                 # boilerplate Vite template text
    ├── vite.config.ts            # @ alias → ./src, Tailwind + React plugins
    ├── tsconfig.json             # project references (app + node)
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    │
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    │
    └── src/
        ├── main.tsx              # React entry point (StrictMode + createRoot)
        ├── App.tsx               # Landing page (navbar, hero, stats, footer)
        ├── FileUpload.tsx        # Drag-and-drop upload + two-panel result layout
        ├── index.css             # Tailwind 4 + neo-brutalist design tokens
        │
        ├── assets/
        │   ├── hero.png
        │   ├── react.svg
        │   └── vite.svg
        │
        ├── hooks/
        │   └── use-mobile.ts     # useIsMobile() hook (768px) — unused
        │
        ├── lib/
        │   └── utils.ts          # cn() helper (clsx + tailwind-merge)
        │
        └── components/
            ├── custom/
            │   ├── PrescriptionDashboard.tsx  # main result dashboard + PDF export
            │   └── PdfViewer.tsx              # standalone PDF viewer (unused)
            │
            └── ui/               # ~60 shadcn/ui primitives (only ~5 actually used)
                ├── accordion.tsx
                ├── alert-dialog.tsx
                ├── alert.tsx
                ├── avatar.tsx
                ├── badge.tsx
                ├── button.tsx
                ├── card.tsx
                ├── dialog.tsx
                ├── dropdown-menu.tsx
                ├── input.tsx
                ├── label.tsx
                ├── scroll-area.tsx
                ├── separator.tsx
                ├── skeleton.tsx
                ├── table.tsx
                ├── tabs.tsx
                ├── textarea.tsx
                └── ... (40+ more unused components)
```

---

## 3. Backend detail

### `src/index.ts` — Express server (73 lines)

- **`POST /upload-file`** — multipart upload, single field `file`, max 20 MB.
- Uses `multer` writing to OS temp dir; file is deleted in a `finally` block
  (good hygiene).
- LlamaCloud pipeline: `files.create` → `parsing.parse` (`tier: "agentic"`,
  `expand: ["markdown_full"]`).
- If Markdown is returned, delegates to `ai_handler()`; otherwise returns raw
  `markdown_full`.
- CORS from `CORS_ORIGIN` env (default `*`), JSON body limit 20 MB.
- Listens on `PORT` env (default 3000).

### `src/utils/ai_handler.ts` — AI pipeline (222 lines)

Three sequential stages:

1. **`extractPrescription(text)`** — `callGroq()` (JSON mode,
   `llama-3.3-70b-versatile`, temp 0.1) produces structured prescription JSON
   conforming to `PRESCRIPTION_EXTRACT_PROMPT` schema.

2. **`callGroqForWebSearch(system, user, medicineCount)`** — agentic loop with
   `openai/gpt-oss-120b`. The model calls a `searchWeb` tool (Tavily, 3 results,
   basic depth). Max `medicineCount + 2` searches; a hard-cap user message forces
   final JSON. Parses JSON with fallback regex extraction for markdown-wrapped
   responses. Unknown tool calls are treated as "final answer submitted via args".

3. **`generatePrescriptionInsights(enrichedData)`** — `callGroq()` again to build
   the patient-facing guide, merging `medicine_verification` data in.

**`ai_handler(text, mode)`** orchestrates all three steps and returns:
```ts
{ extracted, medicine_verification, insights }
```

Notable handling: medicines with a null name (illegible handwriting) get a
fallback label like `Medicine 4 (illegible)` derived from the raw text.

Dead code: `mode` parameter and `modes` enum are declared but never used — the
handler is hardcoded to `"prescription"` mode.

### `src/prompts/prescription.ts` — Prompt templates (329 lines)

- **`PRESCRIPTION_EXTRACT_PROMPT`** — large schema: `document_type`, `patient`,
  `doctor`, `visit`, `diagnosis`, `complaints`, `medications` (name/strength/form/
  dosage_pattern + morning/afternoon/night display/duration/timing/route/
  instructions/confidence/raw_text), `investigations`, `procedures`, `vitals`,
  `lifestyle_advice` (type + description), `uncertain_fields`.

- **`PRESCRIPTION_VERIFY_PROMPT`** — medicine verification schema: `is_valid`,
  `corrected_name`, `manufacturer`, `approximate_price`, `pharmacy_links`,
  `confidence`.

- **`PRESCRIPTION_INSIGHT_PROMPT`** — patient guide schema: `summary`,
  `medicine_details`, `investigations`, `vitals_monitoring`, `lifestyle_advice`,
  `do`, `avoid`, `warning_signs`, `questions_for_doctor`, `disclaimer`.

---

## 4. Frontend detail

### `App.tsx` — Landing page (205 lines)

- Sticky navbar with logo and "Get Started" button.
- Hero section: announcement pill, headline (serif font), subheadline, CTA buttons,
  trust strip badges, mock prescription preview card.
- Upload section: `FileUpload` component with alternating warm peach background.
- Stats section: 4 neo-brutalist stat cards (Prescriptions Analyzed, Accuracy Rate,
  Average Analysis Time, Happy Users) with blue tint background.
- Footer with copyright and disclaimer.

### `FileUpload.tsx` — Upload + result view (~560 lines)

- **Drag & drop + click-to-browse**, accept `image/*,application/pdf`.
- Object-URL preview (revoked on cleanup), file info card, "Extract & Analyze"
  button posting `FormData` to `${VITE_API_URL || ""}/upload-file`.
- **Loading state**: Immediately switches to two-panel layout with:
  - Left: Document viewer (PDF/image)
  - Right: `AnalysisSkeleton` — animated skeleton loader matching dashboard structure
- **Result state**: Left document viewer + right `PrescriptionDashboard`.
- PDF export integration via ref.
- `DocumentViewer` component with page navigation, zoom controls, file info header.

### `PrescriptionDashboard.tsx` — Result dashboard (~484 lines)

- **Compact mode** (`compact` prop): Reduces padding for embedded two-panel view.
- Renders clinic header (doctor name/speciality/hospital/address/contact) with
  primary blue gradient background.
- Patient + date row with secondary-colored badges.
- Medications table with:
  - Color-coded morning (blue), afternoon (amber), night (violet) badges
  - Form badges, dosage patterns, timing/route/notes
  - Vertical dividers between columns
- Doctor advice section with primary-colored bullets.
- Full AI "Patient Guide":
  - Overview with left accent bar
  - To Do / To Avoid cards with gradient backgrounds and blur orbs
  - Medicine detail cards with hover effects, validity badges, prices, pharmacy links
  - Warning signs section with destructive gradient
  - Questions for doctor with numbered badges
  - Disclaimer footer
- **PDF export** via `html-to-image.toPng` → `jsPDF` (raster image).

### `PdfViewer.tsx` — Standalone PDF viewer (121 lines)

- Uses `react-pdf` with page navigation and zoom.
- **Currently unused** — functionality is duplicated inline in `FileUpload.tsx`.

### `index.css` — Theme + Design System (224 lines)

**Neo-brutalist design tokens:**
- Background: `#f5f5f5` (light gray, not warm)
- Foreground: `#0a0a0a` (pure black)
- Primary: `#2563eb` (bold blue)
- Secondary: `#ffedd5` (warm peach)
- Accent: `#fef08a` (bright yellow)
- Destructive: `#ef4444` (red)
- Border: `#0a0a0a` (black, 2px thick)
- Radius: `0px` (sharp corners)
- Shadows: Solid offset `4px 4px 0px 0px #0a0a0a` (no blur)

**Custom scrollbar classes:**
- `.scroll-primary` — thin 5px bar using border color
- `.scroll-muted` — thin 6px bar with hover effect

**Dark mode:** Full dark theme with inverted colors and light shadows.

---

## 5. Config

| File | Notes |
|---|---|
| `package.json` (root) | name is stale: **`seo-tracker`**. `type: module`; scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist). Contains `latest@0.2.0`. |
| `tsconfig.json` (root) | target ES2020, **module CommonJS**, strict. |
| `client/package.json` | React 19, Vite 8, Tailwind 4, `@shadcn/react`, jspdf, html-to-image, recharts, etc. Also contains `latest@0.2.0`. |
| `client/tsconfig.*` | Project references, `@/*` alias, bundler resolution, `erasableSyntaxOnly`. |
| `.env` (root) | Keys: BROWSERBASE (unused), LLAMA, GROQ, TAVILY, PORT, CORS_ORIGIN. Gitignored. |
| `client/.env` | `VITE_API_URL=http://localhost:3000`. |
| `.gitignore` | `node_modules/`, `dist/`, `.env` — but `client/dist/` is checked into the working tree. |

---

## 6. Findings & issues

### High priority

| # | Issue | Location |
|---|---|---|
| 1 | **Module mismatch — `npm run start` is broken.** `package.json` has `"type": "module"` but `tsconfig` emits CommonJS (`module: "commonjs"`), so `node dist/index.js` fails at runtime. The dev script (`tsx`) works because tsx handles this transparently. **Fix:** align tsconfig (`"module": "nodenext"` / `"ESNext"`) or drop `"type": "module"`. | `package.json`, `tsconfig.json` |
| 2 | **`doctor_advice` bug — Doctor Advice never renders.** `PrescriptionDashboard.tsx:27` destructures `doctor_advice`, but the extraction prompt produces `lifestyle_advice: [{type, description}]`. The dashboard reads `advice.text` (line ~214), so the block renders nothing with current backend output. **Fix:** align field names across prompt schema and dashboard. | `PrescriptionDashboard.tsx`, `prescription.ts` |
| 3 | **Unused `mode` parameter — dead code.** `ai_handler(text, mode)` and the `modes` enum are exported but `mode` is never read inside the handler (hardcoded `"prescription"`). A "report" mode is defined but does nothing. | `ai_handler.ts` |

### Medium priority

| # | Issue | Location |
|---|---|---|
| 4 | **No error handling on first JSON parse.** `callGroq()` does bare `JSON.parse(...)` without try/catch. A malformed LLM response throws and bubbles as a raw 500 error — inconsistent with the defensive parsing in `callGroqForWebSearch`. | `ai_handler.ts` |
| 5 | **Schema drift between prompts and UI.** Dashboard references `med.dosage_pattern` (legacy fallback) and `insights.medicine_explanations` (fallback) alongside `medicine_details`, suggesting prompts and UI are out of sync and using parallel fallback paths. | `PrescriptionDashboard.tsx`, `prescription.ts` |
| 6 | **No backend validation of file type** beyond multer size limit. Any binary file (ZIP, EXE, etc.) is forwarded to LlamaCloud. | `src/index.ts` |
| 7 | **`latest@0.2.0` dependency** in both `package.json` files — suspicious/unnecessary package with no clear purpose. | `package.json`, `client/package.json` |
| 8 | **`client/dist/` checked in.** The built output directory exists in the working tree despite being gitignored. | `.gitignore`, `client/dist/` |
| 9 | **`raw_text` for medicines is optional in practice.** `ai_handler` reads `m.raw_text` for fallback naming, but the extract prompt schema allows null — fallback may receive null. | `ai_handler.ts`, `prescription.ts` |

### Low / polish

| # | Issue |
|---|---|
| 10 | Stale package name `seo-tracker`; empty description in root `package.json`. |
| 11 | `client/README.md` is boilerplate Vite template text — not project-specific. |
| 12 | `index.html` title is just "client". |
| 13 | Font mismatch: CSS declares Inter Tight / Instrument Serif / JetBrains Mono; `@fontsource-variable` packages for Inter, Manrope, JetBrains Mono are installed but never imported — declared fonts silently fall back. |
| 14 | `use-mobile.ts` hook and most `ui/` components are unused dead weight (~55 unused shadcn components). |
| 15 | `PdfViewer.tsx` duplicates functionality already built inline in `FileUpload.tsx`. |
| 16 | `vite.config.ts` uses `import.meta.dirname` (Node 20.11+); fine for dev but worth noting for older CI runners. |
| 17 | PDF export is rasterized (html-to-image → jsPDF) — produces non-selectable text and potentially large image blobs for complex dashboards. |
| 18 | `html2canvas`, `recharts`, `date-fns`, `embla-carousel-react`, `cmdk`, `input-otp`, `react-day-picker`, `react-resizable-panels` are installed but unused in app code. |
| 19 | `BROWSERBASE_API_KEY` in `.env` is unused by any code. |

### Security

- `.env` contains live API keys for LlamaCloud, Groq, Tavily, and Browserbase.
  While `.env` is gitignored, keys should be rotated if they were ever committed
  to git history. `BROWSERBASE_API_KEY` is unused entirely.

---

## 7. Dependencies at a glance

### Backend

| Package | Version | Purpose |
|---|---|---|
| express | ^5.2.1 | HTTP server (Express 5) |
| multer | ^2.2.0 | Multipart file upload handling |
| cors | ^2.8.6 | CORS middleware |
| dotenv | ^17.4.2 | Environment variable loading |
| @llamaindex/llama-cloud | ^2.13.0 | Document parsing/OCR via LlamaCloud API |
| groq-sdk | ^1.5.0 | LLM calls (Groq-hosted models) |
| @tavily/core | ^0.7.7 | Web search API for medicine verification |
| latest | ^0.2.0 | **Unnecessary/suspicious** |
| typescript | ^7.0.2 | TypeScript compiler (dev) |
| tsx | ^4.23.1 | TypeScript execution (dev) |
| ts-node-dev | ^2.0.0 | TypeScript dev server with restart (dev) |
| @types/* | various | Type definitions (dev) |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| react / react-dom | ^19.2.8 | UI framework (React 19) |
| vite | ^8.2.0 | Build tool / dev server |
| tailwindcss | ^4.3.3 | Utility-first CSS (Tailwind 4) |
| @tailwindcss/vite | ^4.3.3 | Tailwind Vite plugin |
| @shadcn/react | ^0.3.0 | UI component system |
| @base-ui/react | ^1.7.0 | Base UI primitives |
| lucide-react | ^1.28.0 | Icon library |
| @phosphor-icons/react | ^2.1.10 | Icon library (additional) |
| class-variance-authority | ^0.7.1 | Variant styling utility |
| clsx | ^2.1.1 | Conditional class utility |
| tailwind-merge | ^3.6.0 | Tailwind class merging |
| jspdf | ^4.2.1 | PDF generation (client-side) |
| html-to-image | ^1.11.13 | DOM-to-image capture for PDF export |
| react-pdf | ^10.4.1 | PDF rendering component |
| tw-animate-css | ^1.4.0 | Tailwind animations |
| latest | ^0.2.0 | **Unnecessary/suspicious** |

**Installed but unused:** `html2canvas`, `recharts`, `date-fns`, `embla-carousel-react`, `cmdk`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `@fontsource-variable/*` (Inter, Manrope, JetBrains Mono).

### AI / LLM stack

| Service | SDK | Model(s) | Use |
|---|---|---|---|
| LlamaCloud | `@llamaindex/llama-cloud` | — | Document parsing (agentic tier) |
| Groq | `groq-sdk` | `llama-3.3-70b-versatile` | Structured extraction + insights (JSON mode, temp 0.1) |
| Groq | `groq-sdk` | `openai/gpt-oss-120b` | Agentic medicine verification (tool calling, temp 0.3) |
| Tavily | `@tavily/core` | — | Web search (3 results, basic depth) |

---

## 8. Git history

```
68045f5 Add new prompts
22c8625 fix project
06086c1 done project
3f6d644 fix wraper
61f471a My first Commit
```

5 commits total — relatively young project.

---

## 9. Architecture diagram

```
┌──────────────────┐      POST /upload-file       ┌────────────────────┐
│                  │  ───────(FormData)─────────>  │                    │
│   React 19       │                               │   Express 5        │
│   Vite 8         │  <───────(JSON)────────────   │   (TypeScript)     │
│   (port 5173)    │                               │   (port 3000)      │
│                  │                               │                    │
│   App.tsx        │                               │   index.ts         │
│   FileUpload.tsx │                               │     │              │
│   Dashboard.tsx  │                               │     ▼              │
│                  │                               │   ai_handler.ts    │
└──────────────────┘                               │     │              │
                                                   │     ├── extract()  │
                                                   │     ├── verify()   │
                                                   │     └── insights() │
                                                   └────────┬──────────┘
                                                            │
                                              ┌─────────────┼─────────────┐
                                              │             │             │
                                       ┌──────┴──────┐ ┌───┴────┐ ┌──────┴──────┐
                                       │ LlamaCloud  │ │  Groq  │ │   Tavily    │
                                       │ (OCR/Parse) │ │(2 LLMs)│ │ (Web Search)│
                                       └─────────────┘ └────────┘ └─────────────┘
```

---

## 10. Design system (Neo-Brutalist)

### Color palette

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `--background` | `#f5f5f5` | `#0a0a0a` | Page background (cool gray) |
| `--foreground` | `#0a0a0a` | `#f5f5f5` | Text, borders |
| `--card` | `#ffffff` | `#1a1a1a` | Card backgrounds |
| `--primary` | `#2563eb` | `#60a5fa` | Primary actions, links |
| `--secondary` | `#ffedd5` | `#1e3a8a` | Warm accent, secondary buttons |
| `--accent` | `#fef08a` | `#facc15` | Highlights, badges |
| `--destructive` | `#ef4444` | `#f87171` | Errors, warnings |
| `--border` | `#0a0a0a` | `#f5f5f5` | All borders (2px black) |
| `--muted` | `#e5e5e5` | `#262626` | Muted backgrounds |

### Design principles

- **Sharp corners**: `border-radius: 0px` everywhere
- **Thick borders**: `border-2 border-foreground` (2px black)
- **Solid shadows**: `4px 4px 0px 0px #0a0a0a` (no blur)
- **Hover effects**: Translate `[-2px, -2px]` + larger shadow (lift effect)
- **Typography**: Uppercase tracking-widest for headings, bold weights
- **Icons**: Wrapped in bordered containers with primary/secondary backgrounds

### Section backgrounds (alternating)

| Section | Background |
|---|---|
| Hero | `#f5f5f5` (default) |
| Upload | `bg-secondary/40` (warm peach tint) |
| Stats | `bg-primary/5` (light blue tint) |
| Footer | `bg-secondary/30` (warm peach tint) |

### Button styles

| Type | Style |
|---|---|
| Primary | Blue bg, black border, offset shadow, hover lift |
| Secondary | Warm peach bg, black border, offset shadow, hover lift |
| Outline | Transparent bg, black border, offset shadow, hover lift |

---

## 11. Suggested roadmap

1. **Fix backend module/build mismatch** (#1) — align `tsconfig.json` module output
   with `"type": "module"` in `package.json` so `npm run start` works.
2. **Sync extraction schema with dashboard** (#2, #5) — align `lifestyle_advice` /
   `doctor_advice` field names and `advice.description` vs `advice.text`.
3. **Add JSON-parse guards** (#4) — wrap `callGroq()` parse in try/catch with a
   typed error response.
4. **Validate upload file type/MIME** on the server (#6).
5. **Remove dead code** (#3, #14, #15, #18): unused `mode`/`modes`, `latest` dep,
   unused UI components, `PdfViewer.tsx`, unused npm packages.
6. **Rotate API keys** if they were ever committed; consider a secret manager.
7. **Add tests** — backend unit tests for prompt schemas, e2e happy-path test.
8. **Optional enhancements:**
   - Streaming/SSE progress events during the long AI pipeline.
   - Text-selectable PDF export (replace raster approach).
   - Fix font declarations or import the installed `@fontsource-variable` packages.
