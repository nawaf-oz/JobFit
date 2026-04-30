"use client";

import { useState } from "react";
import { extractText } from "@/lib/parseFile";
import { generateQuestions, parseCV } from "@/lib/ai";
import type {
  ContactLink,
  CVData,
  ProviderConfig,
  ScreeningQuestion,
} from "@/lib/types";

type Props = {
  config: ProviderConfig;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  extraSkills: string;
  setExtraSkills: (v: string) => void;
  customLinks: ContactLink[];
  setCustomLinks: (l: ContactLink[]) => void;
  onParsed: (cv: CVData, qs: ScreeningQuestion[]) => void;
};

const SUGGESTED_LABELS = ["GitHub", "LinkedIn", "Portfolio", "Twitter", "Behance"];

export default function StepUpload({
  config,
  jobDescription,
  setJobDescription,
  extraSkills,
  setExtraSkills,
  customLinks,
  setCustomLinks,
  onParsed,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  const updateLink = (i: number, patch: Partial<ContactLink>) => {
    setCustomLinks(customLinks.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLink = (label = "") =>
    setCustomLinks([...customLinks, { label, url: "" }]);
  const removeLink = (i: number) =>
    setCustomLinks(customLinks.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError("");
    if (!config.apiKey) return setError("Add your API key first.");
    if (!file) return setError("Choose a CV file.");
    if (!jobDescription.trim()) return setError("Paste the job description.");

    setBusy(true);
    try {
      setStatus("Reading your CV...");
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <section className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Your CV</label>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all ${
            drag
              ? "border-violet-500 bg-violet-50"
              : file
              ? "border-emerald-400 bg-emerald-50/40"
              : "border-violet-200 bg-violet-50/30 hover:border-violet-400 hover:bg-violet-50/60"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="text-3xl">{file ? "📄" : "⬆️"}</div>
          {file ? (
            <>
              <div className="text-sm font-semibold text-emerald-700">{file.name}</div>
              <div className="text-xs text-slate-500">Click or drop to replace</div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-700">
                Drop your CV here or click to browse
              </div>
              <div className="text-xs text-slate-500">PDF, DOCX, TXT, or MD</div>
            </>
          )}
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Job description</label>
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job posting here..."
          className="field"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Extra skills <span className="font-normal text-slate-500">(optional — anything not yet on your CV)</span>
        </label>
        <textarea
          rows={3}
          value={extraSkills}
          onChange={(e) => setExtraSkills(e.target.value)}
          placeholder="e.g. fluent Spanish, AWS Lambda, side project shipping..."
          className="field"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-800">
            Links for communication{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => addLink()}
            className="btn-ghost"
          >
            + Add link
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Add the label you want shown on your CV (e.g. <code className="rounded bg-slate-100 px-1">GitHub</code>) and the URL it should link to. These become clickable in the exported CV.
        </p>

        {customLinks.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTED_LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => addLink(l)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                + {l}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {customLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-stretch">
              <input
                type="text"
                placeholder="Label (e.g. GitHub)"
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                className="field w-40"
              />
              <input
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                className="field flex-1"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="rounded-xl px-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                aria-label="Remove link"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
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

      <div className="flex justify-end">
        <button onClick={submit} disabled={busy} className="btn-primary">
          {busy ? "Working..." : "Continue →"}
        </button>
      </div>
    </section>
  );
}
