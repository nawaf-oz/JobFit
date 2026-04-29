# JobFit

Tailor your CV and cover letter to a job description, all in your browser.

You upload your CV, paste a job description, list any extra skills, answer a few screening questions, and JobFit produces an ATS-friendly tailored CV and a cover letter — downloadable as `.docx` or `.pdf`.

Bring your own API key. Choose between Claude (Anthropic), ChatGPT (OpenAI), or Gemini (Google). Nothing leaves your browser except direct calls to the provider you pick.

## Features

- Pick your AI provider: Claude (Anthropic), ChatGPT (OpenAI), or Gemini (Google)
- Reads PDF and DOCX CVs in the browser (no upload server)
- Generates screening questions based on gaps between your CV and the job description
- Rewrites your CV against the job description
- Drafts a cover letter from the same context
- Three ATS-friendly templates: Classic, Modern, Compact
- Export both the CV and cover letter as `.docx` and `.pdf`
- API keys stored in `localStorage` only (one per provider)

## Stack

- Next.js 14, React, TypeScript, Tailwind
- `@anthropic-ai/sdk`, `openai`, `@google/generative-ai` (all in browser mode)
- `pdfjs-dist`, `mammoth` for parsing
- `docx`, `jspdf` for export

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, pick a provider, and paste that provider's API key.

## How it works

1. The CV file is parsed to plain text in the browser.
2. The model extracts it into structured JSON.
3. The model generates 3–5 screening questions targeting gaps with the job description.
4. After you answer, the model rewrites the CV honoring the original facts and your answers.
5. The model drafts a cover letter from the tailored CV.
6. The result is rendered to `.docx` or `.pdf` client-side.

The model is constrained to not invent employers, titles, dates, or degrees. It can rephrase, reorder, and emphasize.

## Privacy

- Your CV text is sent only to the provider you pick, from your browser, using your own key.
- API keys are stored in `localStorage` on your device. Clear them any time from the UI.
- No backend, no analytics, no telemetry.

## Get an API key

- **Claude (Anthropic):** https://console.anthropic.com — default model `claude-sonnet-4-5-20250929`
- **ChatGPT (OpenAI):** https://platform.openai.com/api-keys — default model `gpt-4o`
- **Gemini (Google):** https://aistudio.google.com/apikey — default model `gemini-2.5-flash`

Default models are set in [src/lib/ai.ts](src/lib/ai.ts) and can be edited.

## License

MIT
