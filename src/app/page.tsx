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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">JobFit</h1>
        <p className="mt-2 text-sm opacity-70">
          Tailor your CV and cover letter to a job description. Everything runs in your browser — your CV is sent only to your chosen AI provider.
        </p>
      </header>

      <ApiKeyBox config={config} setConfig={setConfig} />

      <nav className="mt-8 mb-6 flex gap-2 text-xs uppercase tracking-wide opacity-70">
        <span className={step === "upload" ? "font-bold opacity-100" : ""}>1. Upload</span>
        <span>›</span>
        <span className={step === "questions" ? "font-bold opacity-100" : ""}>2. Screening</span>
        <span>›</span>
        <span className={step === "result" ? "font-bold opacity-100" : ""}>3. Result</span>
      </nav>

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

      <footer className="mt-16 text-xs opacity-50">
        Open source on GitHub. Bring your own API key. No data leaves your browser except direct calls to your chosen AI provider.
      </footer>
    </main>
  );
}
