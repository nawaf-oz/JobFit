"use client";

import { useEffect, useState } from "react";
import ApiKeyBox from "@/components/ApiKeyBox";
import StepUpload from "@/components/StepUpload";
import StepQuestions from "@/components/StepQuestions";
import StepResult from "@/components/StepResult";
import type {
  CVData,
  Provider,
  ProviderConfig,
  ScreeningAnswer,
  ScreeningQuestion,
  Template,
} from "@/lib/types";

type Step = "upload" | "questions" | "result";

const VALID_PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "questions", label: "Screening" },
  { id: "result", label: "Result" },
];

export default function Home() {
  const [config, setConfig] = useState<ProviderConfig>({
    provider: "anthropic",
    apiKey: "",
  });
  const [step, setStep] = useState<Step>("upload");

  const [originalCv, setOriginalCv] = useState<CVData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [extraSkills, setExtraSkills] = useState("");

  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [answers, setAnswers] = useState<ScreeningAnswer[]>([]);

  const [tailoredCv, setTailoredCv] = useState<CVData | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [template, setTemplate] = useState<Template>("classic");

  useEffect(() => {
    const storedProvider = localStorage.getItem("jobfit_provider") as Provider | null;
    const provider =
      storedProvider && VALID_PROVIDERS.includes(storedProvider) ? storedProvider : "anthropic";
    const apiKey = localStorage.getItem(`jobfit_key_${provider}`) ?? "";
    setConfig({ provider, apiKey });
  }, []);

  const reset = () => {
    setStep("upload");
    setOriginalCv(null);
    setJobDescription("");
    setExtraSkills("");
    setQuestions([]);
    setAnswers([]);
    setTailoredCv(null);
    setCoverLetter("");
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700 shadow-sm">
          <span className="size-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
          Bring your own AI key — runs in your browser
        </div>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
          JobFit
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
          Tailor your CV and cover letter to any job description in seconds. ATS-friendly, downloadable, and privacy-first.
        </p>
      </header>

      <ApiKeyBox config={config} setConfig={setConfig} />

      <nav className="mt-10 mb-6 flex items-center justify-center gap-3">
        {STEPS.map((s, i) => {
          const active = s.id === step;
          const done = i < stepIndex;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                    : done
                    ? "bg-violet-100 text-violet-700"
                    : "bg-white border border-slate-200 text-slate-500"
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-white/25" : done ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-6 ${
                    done ? "bg-violet-400" : "bg-slate-300"
                  } transition-colors`}
                />
              )}
            </div>
          );
        })}
      </nav>

      <div className="card p-6 sm:p-8">
        {step === "upload" && (
          <StepUpload
            config={config}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            extraSkills={extraSkills}
            setExtraSkills={setExtraSkills}
            onParsed={(cv, qs) => {
              setOriginalCv(cv);
              setQuestions(qs);
              setAnswers(qs.map((q) => ({ id: q.id, answer: "" })));
              setStep("questions");
            }}
          />
        )}

        {step === "questions" && originalCv && (
          <StepQuestions
            config={config}
            cv={originalCv}
            jobDescription={jobDescription}
            extraSkills={extraSkills}
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => setStep("upload")}
            onDone={(tailored, letter) => {
              setTailoredCv(tailored);
              setCoverLetter(letter);
              setStep("result");
            }}
          />
        )}

        {step === "result" && tailoredCv && (
          <StepResult
            cv={tailoredCv}
            coverLetter={coverLetter}
            template={template}
            setTemplate={setTemplate}
            onRestart={reset}
          />
        )}
      </div>

      <footer className="mt-10 text-center text-xs text-slate-500">
        Open source on{" "}
        <a
          href="https://github.com/nawaf-oz/JobFit"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-violet-700 hover:text-violet-900 underline-offset-2 hover:underline"
        >
          GitHub
        </a>
        . No backend, no telemetry. Your CV is sent only to your chosen AI provider.
      </footer>
    </main>
  );
}
