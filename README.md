# JobFit

> Tailor your CV and cover letter to any job description, fully in your browser.

JobFit takes your existing CV and a job posting, asks a few quick screening questions, then rewrites your CV and drafts a cover letter to match the role. Everything runs locally — your CV is sent only to the AI provider you pick, using your own API key.

---

## ✨ What it does

- **Reads your CV** (PDF, DOCX, TXT, MD) directly in the browser — no upload server.
- **Asks smart questions** — multiple-choice, mixing CV gaps and per-project relevance ("did this project use the JD's tech?").
- **Rewrites your CV** to match the job description, ATS-friendly, on a single page.
- **Drafts a cover letter** with real voice — no corporate filler, no boilerplate openers.
- **Pick your AI**: Claude (Anthropic), ChatGPT (OpenAI), or Gemini (Google).
- **Three templates**: Classic, Modern, Compact — with a live preview.
- **Custom hyperlinks**: add labeled links (GitHub, LinkedIn, Portfolio…) — clickable in the exported PDF and DOCX.
- **Exports**: `.docx` and `.pdf`, both ATS-readable.
- **Privacy-first**: API keys live in `localStorage` only. No backend, no analytics, no telemetry.

---

## 🚀 Run it

You need [Node.js](https://nodejs.org) 18+ and npm.

```bash
git clone https://github.com/nawaf-oz/JobFit.git
cd JobFit
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

To build for production:

```bash
npm run build
npm start
```

---

## 🔑 Get an API key

You bring your own. Pick one provider:

| Provider                    | Get a key                                                                | Default model                  | Free tier? |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------ | ---------- |
| **Claude** (Anthropic)      | [console.anthropic.com](https://console.anthropic.com)                   | `claude-sonnet-4-5-20250929`   | No         |
| **ChatGPT** (OpenAI)        | [platform.openai.com/api-keys](https://platform.openai.com/api-keys)     | `gpt-4o`                       | No         |
| **Gemini** (Google)         | [aistudio.google.com/apikey](https://aistudio.google.com/apikey)         | `gemini-2.5-flash`             | Yes        |

Default models are set in [`src/lib/ai.ts`](src/lib/ai.ts) — change them if you want.

---

## 📋 How to use

1. **Pick your provider** at the top of the page (Claude, ChatGPT, or Gemini).
2. **Paste your API key** and click **Save**. It's stored only in your browser's `localStorage`.
3. **Drop your CV** (PDF / DOCX / TXT / MD) into the upload zone.
4. **Paste the job description** — the full posting works best.
5. *(Optional)* List **extra skills** not yet on your CV.
6. *(Optional)* Add **labeled links** (e.g. `GitHub` → your GitHub URL). They become clickable in the exported CV.
7. Click **Continue** — JobFit parses your CV and generates screening questions.
8. **Answer the questions** (multiple choice + an "Other" option for free-text).
9. JobFit tailors your CV and drafts a cover letter.
10. **Pick a template** and **download** the CV and cover letter as `.docx` or `.pdf`.

---

## 🧠 How it works

1. Your CV is parsed to text in the browser using `pdfjs-dist` (PDF) or `mammoth` (DOCX).
2. The selected model extracts it into structured JSON.
3. The model generates 4–7 screening questions: gap questions + one per project ("did you use [JD tech] in [Project Name]?").
4. After you answer, the model rewrites the CV — emphasizing relevant projects, rephrasing bullets, fitting one page.
5. The model drafts a cover letter from the tailored CV using your Q&A answers for tone and specifics.
6. The CV is rendered to `.docx` (using `docx`) or `.pdf` (using `jspdf`) entirely client-side.

The model is instructed not to invent employers, titles, dates, degrees, or projects — only to rephrase, reorder, and emphasize. Project bullets are kept untouched if you say the project didn't use the JD's tech.

---

## 🔒 Privacy

- Your CV text is sent **only** to the provider you pick, from your browser, using your own key.
- API keys are stored in `localStorage` on your device. The "Clear" button in the UI removes them.
- No backend, no analytics, no telemetry. JobFit is a static site — there's no server holding your data.

---

## 🧱 Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- AI SDKs (browser mode): [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk), [`openai`](https://www.npmjs.com/package/openai), [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai)
- Parsing: [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist), [`mammoth`](https://www.npmjs.com/package/mammoth)
- Export: [`docx`](https://www.npmjs.com/package/docx), [`jspdf`](https://www.npmjs.com/package/jspdf), [`file-saver`](https://www.npmjs.com/package/file-saver)

---

## 📁 Project structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout, metadata
│   ├── page.tsx          # Multi-step flow (Upload → Questions → Result)
│   ├── globals.css       # Tailwind + theme
│   └── icon.svg          # Favicon
├── components/
│   ├── ApiKeyBox.tsx     # Provider picker + key input
│   ├── StepUpload.tsx    # File upload, JD, extra skills, links
│   ├── StepQuestions.tsx # Multiple-choice screening
│   ├── StepResult.tsx    # Templates, preview, downloads
│   └── CVPreview.tsx     # Live styled CV preview
└── lib/
    ├── types.ts          # Shared TypeScript types
    ├── ai.ts             # Provider dispatch + prompts
    ├── parseFile.ts      # PDF / DOCX / TXT extraction
    ├── normalize.ts      # Sanitize AI output
    ├── exportPdf.ts      # PDF generation
    └── exportDocx.ts     # DOCX generation
```

---

## 🤝 Contributing

PRs welcome. Open an issue to discuss anything substantial first.

## 📄 License

MIT — see [LICENSE](LICENSE).
