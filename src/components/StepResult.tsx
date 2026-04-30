"use client";

import { useState } from "react";
import CVPreview from "./CVPreview";
import { exportDocx, exportTextDocx } from "@/lib/exportDocx";
import { exportPdf, exportTextPdf } from "@/lib/exportPdf";
import type { CVData, Template } from "@/lib/types";

type Props = {
  cv: CVData;
  coverLetter: string;
  template: Template;
  setTemplate: (t: Template) => void;
  onRestart: () => void;
};

const TEMPLATES: { id: Template; name: string; blurb: string }[] = [
  { id: "classic", name: "Classic", blurb: "Centered name, dividers." },
  { id: "modern", name: "Modern", blurb: "Left-aligned, accent color." },
  { id: "compact", name: "Compact", blurb: "Tight spacing, dense." },
];

export default function StepResult({ cv, coverLetter, template, setTemplate, onRestart }: Props) {
  const [tab, setTab] = useState<"cv" | "letter">("cv");
  const safe = (cv.name || "cv").replace(/\s+/g, "_");

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("cv")}
          className={`px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
            tab === "cv"
              ? "border-violet-600 text-violet-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Tailored CV
        </button>
        <button
          onClick={() => setTab("letter")}
          className={`px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
            tab === "letter"
              ? "border-violet-600 text-violet-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Cover letter
        </button>
      </div>

      {tab === "cv" ? (
        <>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Pick a template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => {
                const active = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`group relative rounded-xl border p-2 text-left transition-all ${
                      active
                        ? "border-violet-500 ring-2 ring-violet-300 shadow-md"
                        : "border-slate-200 hover:border-violet-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                      <div className="scale-[0.42] origin-top-left h-[160px] w-[238%] -mb-1 pointer-events-none">
                        <CVPreview cv={cv} template={t.id} />
                      </div>
                    </div>
                    <div className="mt-2 px-1">
                      <div
                        className={`text-sm font-semibold ${
                          active ? "text-violet-700" : "text-slate-800"
                        }`}
                      >
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{t.blurb}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Live preview</h3>
            <div className="max-w-[600px] mx-auto">
              <CVPreview cv={cv} template={template} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportDocx(cv, template, `${safe}_CV.docx`)} className="btn-primary">
              ⬇ Download .docx
            </button>
            <button onClick={() => exportPdf(cv, template, `${safe}_CV.pdf`)} className="btn-secondary">
              ⬇ Download .pdf
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-10 py-12 max-h-[640px] overflow-auto">
              <pre
                className="whitespace-pre-wrap text-[13.5px] leading-[1.7] text-slate-900"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {coverLetter}
              </pre>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportTextDocx(coverLetter, `${safe}_CoverLetter.docx`)}
              className="btn-primary"
            >
              ⬇ Download .docx
            </button>
            <button
              onClick={() => exportTextPdf(coverLetter, `${safe}_CoverLetter.pdf`)}
              className="btn-secondary"
            >
              ⬇ Download .pdf
            </button>
          </div>
        </>
      )}

      <div className="pt-4 border-t border-slate-200">
        <button onClick={onRestart} className="btn-ghost">
          ↺ Start over
        </button>
      </div>
    </section>
  );
}
