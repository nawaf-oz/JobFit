"use client";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { normalizeCV } from "./normalize";
import type {
  CVData,
  Provider,
  ProviderConfig,
  ScreeningAnswer,
  ScreeningQuestion,
} from "./types";

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: "Claude (Anthropic)",
  openai: "ChatGPT (OpenAI)",
  gemini: "Gemini (Google)",
};

export const PROVIDER_KEY_HINT: Record<Provider, string> = {
  anthropic: "sk-ant-...",
  openai: "sk-...",
  gemini: "AIza...",
};

export const PROVIDER_CONSOLE: Record<Provider, string> = {
  anthropic: "https://console.anthropic.com",
  openai: "https://platform.openai.com/api-keys",
  gemini: "https://aistudio.google.com/apikey",
};

const MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-5-20250929",
  openai: "gpt-4o",
  gemini: "gemini-2.5-flash",
};

function extractJson<T>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{");
  const startArr = raw.indexOf("[");
  const first =
    start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  if (first === -1) throw new Error("Model did not return JSON.");
  const slice = raw.slice(first);
  const last = Math.max(slice.lastIndexOf("}"), slice.lastIndexOf("]"));
  return JSON.parse(slice.slice(0, last + 1)) as T;
}

async function ask(
  cfg: ProviderConfig,
  system: string,
  user: string,
): Promise<string> {
  if (cfg.provider === "anthropic") {
    const res = await new Anthropic({
      apiKey: cfg.apiKey,
      dangerouslyAllowBrowser: true,
    }).messages.create({
      model: MODELS.anthropic,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty response from Claude.");
    return block.text;
  }

  if (cfg.provider === "openai") {
    const res = await new OpenAI({
      apiKey: cfg.apiKey,
      dangerouslyAllowBrowser: true,
    }).chat.completions.create({
      model: MODELS.openai,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI.");
    return text;
  }

  const model = new GoogleGenerativeAI(cfg.apiKey).getGenerativeModel({
    model: MODELS.gemini,
    systemInstruction: system,
  });
  const res = await model.generateContent(user);
  const text = res.response.text();
  if (!text) throw new Error("Empty response from Gemini.");
  return text;
}

export async function parseCV(cfg: ProviderConfig, rawText: string): Promise<CVData> {
  const system =
    "You extract structured data from CVs. Output strict JSON only, no prose, no markdown fences. Every string field must be a plain string, never an object. Skills must be a flat array of plain strings (skill names only).";
  const user = `Extract this CV into JSON matching this exact TypeScript type:

type CVData = {
  name: string;
  contact: { email?: string; phone?: string; location?: string; links?: string[] };
  summary: string;
  experience: { title: string; company: string; location?: string; start: string; end: string; bullets: string[] }[];
  education: { degree: string; school: string; location?: string; start: string; end: string; details?: string[] }[];
  skills: string[];
  projects?: { name: string; description: string; bullets?: string[] }[];
  certifications?: string[];
};

Rules:
- skills MUST be an array of plain strings, e.g. ["JavaScript", "React", "Node.js"]. Do NOT group, do NOT use objects.
- bullets, details, certifications, links MUST also be plain string arrays.
- Use empty strings or empty arrays when info is missing.
- Preserve original wording in bullets.

CV TEXT:
${rawText}`;
  const parsed = extractJson<CVData>(await ask(cfg, system, user));
  return normalizeCV(parsed);
}

export async function generateQuestions(
  cfg: ProviderConfig,
  cv: CVData,
  jobDescription: string,
  extraSkills: string,
): Promise<ScreeningQuestion[]> {
  const system =
    "You are a recruiter screening a candidate for a specific job. Output strict JSON only.";

  const projectNames = (cv.projects ?? []).map((p) => p.name).filter(Boolean);

  const user = `Generate 4 to 7 short multiple-choice screening questions tailored to this candidate and role.

Mix two kinds:
1. GAP questions — fill gaps between the CV and the job description. Focus on requirements not clearly evidenced.
2. PROJECT-FIT questions — for each of the candidate's projects, ask whether the project actually used a key technology, methodology, or domain mentioned in the job description. The answer determines whether we will rewrite that project's bullets to emphasize the JD's needs (yes), keep the project as-is (no), or partially adjust (somewhat). The question MUST start with the project name in brackets, e.g. "[Zimmam] Did this project use ...?".

Each question:
- One sentence, plain English.
- 3 to 4 distinct, short answer options. Do NOT include an "Other" option (the UI adds it).
- For PROJECT-FIT questions, options should be like: "Yes — heavily", "Yes — partially", "No — not used".

Output JSON array of: { id: string, question: string, reason: string, options: string[] }
Use ids like "q1", "q2", ... in order.

JOB DESCRIPTION:
${jobDescription}

EXTRA SKILLS THE CANDIDATE LISTED:
${extraSkills || "(none)"}

CANDIDATE'S PROJECTS (ask one PROJECT-FIT question per project, max 4):
${projectNames.length ? projectNames.join(", ") : "(none)"}

CV (JSON):
${JSON.stringify(cv)}`;
  return extractJson<ScreeningQuestion[]>(await ask(cfg, system, user));
}

export async function tailorCV(
  cfg: ProviderConfig,
  cv: CVData,
  jobDescription: string,
  extraSkills: string,
  answers: ScreeningAnswer[],
  questions: ScreeningQuestion[],
): Promise<CVData> {
  const qa = questions
    .map((q) => {
      const a = answers.find((x) => x.id === q.id)?.answer ?? "";
      return `Q: ${q.question}\nA: ${a}`;
    })
    .join("\n\n");

  const system = `You rewrite CVs to match a target job. The output must be ATS-friendly and fit on a SINGLE A4 page when rendered at standard 11pt font.

Hard rules:
- Do not invent employment, titles, dates, degrees, or projects. Only reuse facts from the source CV, listed extra skills, and Q&A answers.
- skills must be a flat array of plain strings (e.g. "JavaScript"), never objects, never grouped.
- For each project, use the candidate's "[ProjectName] ..." Q&A answer:
    * "Yes — heavily" or similar: rewrite bullets to emphasize the JD's tools and outcomes.
    * "Yes — partially" / "Somewhat": adjust some bullets toward the JD without overclaiming.
    * "No" / "Not used": KEEP the project's bullets as-is from the source CV. Do not invent JD tech for it.
- Use strong action verbs and quantify only where the source allows.
- Plain formatting only. No emojis, no symbols beyond standard punctuation, no tables, no columns.
- Match keywords from the job description naturally where truthful.

One-page budget (approximate):
- summary: 2-3 sentences max
- top 1-2 most relevant roles: up to 4 bullets each; older/less relevant roles: 1-2 bullets or omit
- top 2-3 projects only (drop the least relevant)
- skills: a single flat list, no more than 15-20 items
- prefer concise bullets (one line each)

Output strict JSON only matching the CVData type.`;

  const user = `JOB DESCRIPTION:
${jobDescription}

EXTRA SKILLS:
${extraSkills || "(none)"}

SCREENING Q&A:
${qa || "(none)"}

ORIGINAL CV (JSON):
${JSON.stringify(cv)}

Return the tailored, one-page CV as JSON matching CVData.`;

  const parsed = extractJson<CVData>(await ask(cfg, system, user));
  return normalizeCV(parsed);
}

export async function generateCoverLetter(
  cfg: ProviderConfig,
  cv: CVData,
  jobDescription: string,
  answers: ScreeningAnswer[],
  questions: ScreeningQuestion[],
): Promise<string> {
  const qa = questions
    .map((q) => {
      const a = answers.find((x) => x.id === q.id)?.answer ?? "";
      return `Q: ${q.question}\nA: ${a}`;
    })
    .join("\n\n");

  const system =
    "You write concise, professional cover letters. Plain text only, no markdown. 3 to 4 short paragraphs. Do not invent facts.";
  const user = `Write a cover letter for this candidate applying to the role below. Reference 2-3 of the most relevant experiences. Keep it under 350 words.

JOB DESCRIPTION:
${jobDescription}

SCREENING Q&A:
${qa || "(none)"}

CANDIDATE CV (JSON):
${JSON.stringify(cv)}`;
  return (await ask(cfg, system, user)).trim();
}
