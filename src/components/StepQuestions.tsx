"use client";

import { useState } from "react";
import { generateCoverLetter, tailorCV } from "@/lib/ai";
import type {
  CVData,
  ProviderConfig,
  ScreeningAnswer,
  ScreeningQuestion,
} from "@/lib/types";

type Props = {
  config: ProviderConfig;
  cv: CVData;
  jobDescription: string;
  extraSkills: string;
  questions: ScreeningQuestion[];
  answers: ScreeningAnswer[];
  setAnswers: (a: ScreeningAnswer[]) => void;
  onBack: () => void;
  onDone: (tailored: CVData, coverLetter: string) => void;
};

export default function StepQuestions({
  config,
  cv,
  jobDescription,
  extraSkills,
  questions,
  answers,
  setAnswers,
  onBack,
  onDone,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const update = (id: string, v: string) =>
    setAnswers(answers.map((a) => (a.id === id ? { ...a, answer: v } : a)));

  const submit = async () => {
    setError("");
    if (answers.some((a) => !a.answer.trim())) {
      return setError("Please answer all questions (a short note is fine).");
    }
    setBusy(true);
    try {
      setStatus("Tailoring your CV...");
      const tailored = await tailorCV(config, cv, jobDescription, extraSkills, answers, questions);
      setStatus("Drafting cover letter...");
      const letter = await generateCoverLetter(config, tailored, jobDescription, answers, questions);
      onDone(tailored, letter);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <section className="space-y-5">
      <p className="text-sm opacity-70">
        Answer these to help tailor the CV. Be honest — anything you say here may be used in the rewrite.
      </p>

      {questions.map((q) => {
        const a = answers.find((x) => x.id === q.id)?.answer ?? "";
        return (
          <div key={q.id}>
            <label className="block text-sm font-medium">{q.question}</label>
            {q.reason && <p className="text-xs opacity-60 mt-1">Why asked: {q.reason}</p>}
            <textarea
              rows={3}
              value={a}
              onChange={(e) => update(q.id, e.target.value)}
              className="mt-2 w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
            />
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {busy && <p className="text-sm opacity-70">{status}</p>}

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded border border-black/15 dark:border-white/20 px-4 py-2 text-sm">
          Back
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Working..." : "Generate"}
        </button>
      </div>
    </section>
  );
}
