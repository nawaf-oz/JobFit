"use client";

import type { CVData, Template } from "@/lib/types";

type Props = {
  cv: CVData;
  template: Template;
};

const SEP = " | ";

export default function CVPreview({ cv, template }: Props) {
  const isModern = template === "modern";
  const isCompact = template === "compact";

  const headerAlign = isModern ? "text-left" : "text-center";
  const nameSize = isCompact ? "text-xl" : "text-2xl";
  const headingClass = isModern
    ? "text-[11px] font-bold tracking-wider uppercase text-violet-700 border-b border-violet-200 pb-1 mt-4 mb-2"
    : isCompact
    ? "text-[11px] font-bold tracking-wider uppercase text-slate-800 mt-3 mb-1.5"
    : "text-sm font-bold tracking-wide uppercase text-slate-800 border-b border-slate-300 pb-1 mt-4 mb-2";

  const sectionGap = isCompact ? "mb-2.5" : "mb-3.5";
  const bulletGap = isCompact ? "mt-0.5" : "mt-1";
  const bodyText = isCompact ? "text-[12px] leading-snug" : "text-[12.5px] leading-relaxed";

  const baseBits = [cv.contact.email, cv.contact.phone, cv.contact.location].filter(Boolean) as string[];
  const linkItems = cv.contact.links ?? [];

  return (
    <div
      className={`bg-white text-slate-900 rounded-lg shadow-sm border border-slate-200 overflow-hidden`}
      style={{ aspectRatio: "1 / 1.414" }}
    >
      <div
        className="w-full h-full p-8 overflow-auto"
        style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
      >
        <div className={headerAlign}>
          <h3 className={`${nameSize} font-extrabold tracking-tight ${isModern ? "text-violet-800" : "text-slate-900"}`}>
            {cv.name || "Your Name"}
          </h3>
          {(baseBits.length > 0 || linkItems.length > 0) && (
            <p className="mt-1 text-[11px] text-slate-500">
              {baseBits.join(SEP)}
              {baseBits.length > 0 && linkItems.length > 0 && SEP}
              {linkItems.map((l, i) => (
                <span key={i}>
                  {i > 0 && SEP}
                  {l.url ? (
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-700 hover:underline"
                    >
                      {l.label || l.url}
                    </a>
                  ) : (
                    <span>{l.label}</span>
                  )}
                </span>
              ))}
            </p>
          )}
        </div>

        {cv.summary && (
          <section className={sectionGap}>
            <h4 className={headingClass}>Summary</h4>
            <p className={`${bodyText} text-slate-800`}>{cv.summary}</p>
          </section>
        )}

        {cv.experience?.length > 0 && (
          <section className={sectionGap}>
            <h4 className={headingClass}>Experience</h4>
            {cv.experience.map((e, i) => (
              <div key={i} className={i > 0 ? "mt-2.5" : ""}>
                <p className="text-[12.5px] font-semibold text-slate-900">
                  {e.title} — {e.company}
                </p>
                <p className="text-[11px] italic text-slate-500">
                  {[e.location, [e.start, e.end].filter(Boolean).join(" – ")].filter(Boolean).join(SEP)}
                </p>
                <ul className={bulletGap}>
                  {e.bullets?.map((b, j) => (
                    <li key={j} className={`${bodyText} text-slate-800 pl-4 relative`}>
                      <span className="absolute left-0">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {cv.education?.length > 0 && (
          <section className={sectionGap}>
            <h4 className={headingClass}>Education</h4>
            {cv.education.map((ed, i) => (
              <div key={i} className={i > 0 ? "mt-2" : ""}>
                <p className="text-[12.5px] font-semibold text-slate-900">
                  {ed.degree} — {ed.school}
                </p>
                <p className="text-[11px] italic text-slate-500">
                  {[ed.location, [ed.start, ed.end].filter(Boolean).join(" – ")].filter(Boolean).join(SEP)}
                </p>
                {ed.details && ed.details.length > 0 && (
                  <ul className={bulletGap}>
                    {ed.details.map((d, j) => (
                      <li key={j} className={`${bodyText} text-slate-800 pl-4 relative`}>
                        <span className="absolute left-0">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {cv.skills?.length > 0 && (
          <section className={sectionGap}>
            <h4 className={headingClass}>Skills</h4>
            <p className={`${bodyText} text-slate-800`}>{cv.skills.join(", ")}</p>
          </section>
        )}

        {cv.projects && cv.projects.length > 0 && (
          <section className={sectionGap}>
            <h4 className={headingClass}>Projects</h4>
            {cv.projects.map((p, i) => (
              <div key={i} className={i > 0 ? "mt-2" : ""}>
                <p className="text-[12.5px] font-semibold text-slate-900">{p.name}</p>
                {p.description && (
                  <p className={`${bodyText} text-slate-700`}>{p.description}</p>
                )}
                {p.bullets && p.bullets.length > 0 && (
                  <ul className={bulletGap}>
                    {p.bullets.map((b, j) => (
                      <li key={j} className={`${bodyText} text-slate-800 pl-4 relative`}>
                        <span className="absolute left-0">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {cv.certifications && cv.certifications.length > 0 && (
          <section className={sectionGap}>
            <h4 className={headingClass}>Certifications</h4>
            <ul>
              {cv.certifications.map((c, i) => (
                <li key={i} className={`${bodyText} text-slate-800 pl-4 relative`}>
                  <span className="absolute left-0">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
