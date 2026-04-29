"use client";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
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
  gemini: "gemini-2.0-flash",
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

  // gemini
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
    "You extract structured data from CVs. Output strict JSON only, no prose, no markdown fences.";
  const user = `Extract this CV into JSON matching this TypeScript type:

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

Use empty strings or empty arrays when info is missing. Preserve original wording in bullets.

CV TEXT:
${rawText}`;
  return extractJson<CVData>(await ask(cfg, system, user));
}

export async function generateQuestions(
  cfg: ProviderConfig,
  cv: CVData,
  jobDescription: string,
  extraSkills: string,
): Promise<ScreeningQuestion[]> {
  const system =
    "You are a recruiter screening a candidate. Output strict JSON only.";
  const user = `Given the candidate's CV and the job description, generate 3 to 5 short screening questions that fill gaps between the CV and the role. Focus on requirements not clearly evidenced in the CV. Keep each question to one sentence.

Output JSON array of: { id: string, question: string, reason: string }
"reason" briefly notes the gap or requirement being checked.

JOB DESCRIPTION:
${jobDescription}

EXTRA SKILLS THE CANDIDATE LISTED:
${extraSkills || "(none)"}

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

  const system = `You rewrite CVs to match a target job, ATS-friendly. Rules:
- Do not invent employment, titles, dates, or degrees. Only reuse facts from the source CV, listed extra skills, and Q&A answers.
- You may rephrase bullets, reorder content, and emphasize relevant experience.
- Use strong action verbs and quantify where the source allows.
- Keep formatting plain (no symbols, emojis, tables, columns).
- Match keywords from the job description naturally where truthful.
- Output strict JSON only matching the CVData type.`;

  const user = `JOB DESCRIPTION:
${jobDescription}

EXTRA SKILLS:
${extraSkills || "(none)"}

SCREENING Q&A:
${qa || "(none)"}

ORIGINAL CV (JSON):
${JSON.stringify(cv)}

Return the tailored CV as JSON matching CVData.`;

  return extractJson<CVData>(await ask(cfg, system, user));
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
