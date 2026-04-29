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

const OTHER = "__OTHER__";

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

  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, ""])),
  );
  const [customText, setCustomText] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, ""])),
  );

  const setSelection = (id: string, value: string) => {
    setSelections((s) => ({ ...s, [id]: value }));
    const finalAnswer = value === OTHER ? customText[id] || "" : value;
    setAnswers(answers.map((a) => (a.id === id ? { ...a, answer: finalAnswer } : a)));
  };

  const setCustom = (id: string, value: string) => {
    setCustomText((s) => ({ ...s, [id]: value }));
    if (selections[id] === OTHER) {
      setAnswers(answers.map((a) => (a.id === id ? { ...a, answer: value } : a)));
    }
  };

  const submit = async () => {
    setError("");
    const missing = questions.find((q) => {
      const sel = selections[q.id];
      if (!sel) return true;
      if (sel === OTHER && !customText[q.id]?.trim()) return true;
      return false;
    });
    if (missing) return setError("Please answer every question.");

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
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">A few quick questions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick the option that fits best. These help tailor your CV honestly — pick &quot;Other&quot; if none match.
        </p>
      </div>

      <div className="space-y-5">
        {questions.map((q, idx) => {
          const sel = selections[q.id];
          return (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  {q.reason && (
                    <p className="mt-1 text-xs text-slate-500">Why asked: {q.reason}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const active = sel === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSelection(q.id, opt)}
                      className={`text-left rounded-lg border px-3.5 py-2.5 text-sm transition-all ${
                        active
                          ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/40"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`flex size-4 items-center justify-center rounded-full border-2 ${
                            active ? "border-violet-600 bg-violet-600" : "border-slate-300"
                          }`}
                        >
                          {active && <span className="size-1.5 rounded-full bg-white" />}
                        </span>
                        {opt}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelection(q.id, OTHER)}
                  className={`text-left rounded-lg border px-3.5 py-2.5 text-sm transition-all sm:col-span-2 ${
                    sel === OTHER
                      ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/40"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`flex size-4 items-center justify-center rounded-full border-2 ${
                        sel === OTHER ? "border-violet-600 bg-violet-600" : "border-slate-300"
                      }`}
                    >
                      {sel === OTHER && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    Other (write your own)
                  </span>
                </button>
              </div>

              {sel === OTHER && (
                <input
                  value={customText[q.id] ?? ""}
                  onChange={(e) => setCustom(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="field mt-3"
                  autoFocus
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {busy && (
        <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">
          <span className="size-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          {status}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button onClick={submit} disabled={busy} className="btn-primary">
          {busy ? "Working..." : "Generate ✨"}
        </button>
      </div>
    </section>
  );
}
