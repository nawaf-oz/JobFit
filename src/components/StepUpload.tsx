"use client";

import { useState } from "react";
import { extractText } from "@/lib/parseFile";
import { generateQuestions, parseCV } from "@/lib/ai";
import type { CVData, ProviderConfig, ScreeningQuestion } from "@/lib/types";

type Props = {
  config: ProviderConfig;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  extraSkills: string;
  setExtraSkills: (v: string) => void;
  onParsed: (cv: CVData, qs: ScreeningQuestion[]) => void;
};

export default function StepUpload({
  config,
  jobDescription,
  setJobDescription,
  extraSkills,
  setExtraSkills,
  onParsed,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!config.apiKey) return setError("Add your API key first.");
    if (!file) return setError("Choose a CV file.");
    if (!jobDescription.trim()) return setError("Paste the job description.");

    setBusy(true);
    try {
      setStatus("Reading CV...");
      const text = await extractText(file);
      if (!text || text.length < 30) throw new Error("Could not read text from this file.");

      setStatus("Parsing CV with AI...");
      const cv = await parseCV(config, text);

      setStatus("Generating screening questions...");
      const qs = await generateQuestions(config, cv, jobDescription, extraSkills);
      onParsed(cv, qs);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Your CV (PDF, DOCX, TXT)</label>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Job description</label>
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job posting here..."
          className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Extra skills not in your CV <span className="opacity-60 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={extraSkills}
          onChange={(e) => setExtraSkills(e.target.value)}
          placeholder="e.g. fluent Spanish, AWS Lambda, side project shipping ..."
          className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {busy && <p className="text-sm opacity-70">{status}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Working..." : "Continue"}
      </button>
    </section>
  );
}
