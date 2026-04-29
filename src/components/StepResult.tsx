"use client";

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
  { id: "classic", name: "Classic", blurb: "Centered name, divider rules, balanced spacing." },
  { id: "modern", name: "Modern", blurb: "Left-aligned, uppercase headings, clean look." },
  { id: "compact", name: "Compact", blurb: "Tight spacing for dense one-page CVs." },
];

export default function StepResult({ cv, coverLetter, template, setTemplate, onRestart }: Props) {
  const safe = (cv.name || "cv").replace(/\s+/g, "_");

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold mb-3">Template</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`text-left rounded border p-3 text-sm ${
                template === t.id
                  ? "border-black dark:border-white"
                  : "border-black/15 dark:border-white/20"
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs opacity-60 mt-1">{t.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Tailored CV</h2>
        <div className="rounded border border-black/15 dark:border-white/20 p-4 text-sm whitespace-pre-wrap">
          {renderPreview(cv)}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => exportDocx(cv, template, `${safe}_CV.docx`)}
            className="rounded bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-xs font-medium"
          >
            Download .docx
          </button>
          <button
            onClick={() => exportPdf(cv, template, `${safe}_CV.pdf`)}
            className="rounded border border-black/15 dark:border-white/20 px-3 py-2 text-xs"
          >
            Download .pdf
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Cover letter</h2>
        <div className="rounded border border-black/15 dark:border-white/20 p-4 text-sm whitespace-pre-wrap">
          {coverLetter}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => exportTextDocx(coverLetter, `${safe}_CoverLetter.docx`)}
            className="rounded bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-xs font-medium"
          >
            Download .docx
          </button>
          <button
            onClick={() => exportTextPdf(coverLetter, `${safe}_CoverLetter.pdf`)}
            className="rounded border border-black/15 dark:border-white/20 px-3 py-2 text-xs"
          >
            Download .pdf
          </button>
        </div>
      </div>

      <button onClick={onRestart} className="text-xs underline opacity-70">
        Start over
      </button>
    </section>
  );
}

function renderPreview(cv: CVData): string {
  const lines: string[] = [];
  lines.push(cv.name);
  const contact = [cv.contact.email, cv.contact.phone, cv.contact.location, ...(cv.contact.links ?? [])]
    .filter(Boolean)
    .join(" | ");
  if (contact) lines.push(contact);
  lines.push("");
  if (cv.summary) {
    lines.push("SUMMARY");
    lines.push(cv.summary, "");
  }
  if (cv.experience?.length) {
    lines.push("EXPERIENCE");
    cv.experience.forEach((e) => {
      lines.push(`${e.title} — ${e.company}`);
      const sub = [e.location, [e.start, e.end].filter(Boolean).join(" – ")].filter(Boolean).join(" | ");
      if (sub) lines.push(sub);
      e.bullets?.forEach((b) => lines.push(`• ${b}`));
      lines.push("");
    });
  }
  if (cv.education?.length) {
    lines.push("EDUCATION");
    cv.education.forEach((ed) => {
      lines.push(`${ed.degree} — ${ed.school}`);
      const sub = [ed.location, [ed.start, ed.end].filter(Boolean).join(" – ")].filter(Boolean).join(" | ");
      if (sub) lines.push(sub);
      ed.details?.forEach((d) => lines.push(`• ${d}`));
      lines.push("");
    });
  }
  if (cv.skills?.length) {
    lines.push("SKILLS");
    lines.push(cv.skills.join(", "), "");
  }
  if (cv.projects?.length) {
    lines.push("PROJECTS");
    cv.projects.forEach((p) => {
      lines.push(p.name);
      if (p.description) lines.push(p.description);
      p.bullets?.forEach((b) => lines.push(`• ${b}`));
      lines.push("");
    });
  }
  if (cv.certifications?.length) {
    lines.push("CERTIFICATIONS");
    cv.certifications.forEach((c) => lines.push(`• ${c}`));
  }
  return lines.join("\n").trim();
}
