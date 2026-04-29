"use client";

import { jsPDF } from "jspdf";
import type { CVData, Template } from "./types";

type Ctx = {
  doc: jsPDF;
  y: number;
  page: { width: number; height: number; margin: number };
};

function newPageIfNeeded(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.page.height - ctx.page.margin) {
    ctx.doc.addPage();
    ctx.y = ctx.page.margin;
  }
}

function writeText(
  ctx: Ctx,
  text: string,
  opts: { size?: number; bold?: boolean; italic?: boolean; align?: "left" | "center"; gap?: number } = {},
) {
  const { size = 11, bold, italic, align = "left", gap = 4 } = opts;
  ctx.doc.setFont("helvetica", bold ? (italic ? "bolditalic" : "bold") : italic ? "italic" : "normal");
  ctx.doc.setFontSize(size);
  const maxWidth = ctx.page.width - ctx.page.margin * 2;
  const lines = ctx.doc.splitTextToSize(text, maxWidth);
  const lineHeight = size * 0.45;
  newPageIfNeeded(ctx, lines.length * lineHeight);
  const x = align === "center" ? ctx.page.width / 2 : ctx.page.margin;
  ctx.doc.text(lines, x, ctx.y, { align });
  ctx.y += lines.length * lineHeight + gap;
}

function sectionHeading(ctx: Ctx, text: string, template: Template) {
  ctx.y += 4;
  const size = template === "compact" ? 11 : 13;
  writeText(ctx, template === "modern" ? text.toUpperCase() : text, {
    size,
    bold: true,
    gap: 2,
  });
  if (template !== "compact") {
    ctx.doc.setDrawColor(180);
    ctx.doc.line(
      ctx.page.margin,
      ctx.y,
      ctx.page.width - ctx.page.margin,
      ctx.y,
    );
    ctx.y += 4;
  }
}

function bullet(ctx: Ctx, text: string) {
  writeText(ctx, `• ${text}`, { size: 10, gap: 2 });
}

export function exportPdf(cv: CVData, template: Template, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), margin: 48 };
  const ctx: Ctx = { doc, y: page.margin, page };

  writeText(ctx, cv.name || "Your Name", {
    size: 20,
    bold: true,
    align: template === "modern" ? "left" : "center",
    gap: 4,
  });

  const contactBits = [
    cv.contact.email,
    cv.contact.phone,
    cv.contact.location,
    ...(cv.contact.links ?? []),
  ].filter(Boolean);
  if (contactBits.length) {
    writeText(ctx, contactBits.join("  |  "), {
      size: 10,
      align: template === "modern" ? "left" : "center",
      gap: 8,
    });
  }

  if (cv.summary) {
    sectionHeading(ctx, "Summary", template);
    writeText(ctx, cv.summary, { size: 10, gap: 6 });
  }

  if (cv.experience?.length) {
    sectionHeading(ctx, "Experience", template);
    cv.experience.forEach((e) => {
      writeText(ctx, `${e.title} — ${e.company}`, { size: 11, bold: true, gap: 2 });
      const sub = [e.location, [e.start, e.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join("  |  ");
      if (sub) writeText(ctx, sub, { size: 10, italic: true, gap: 3 });
      e.bullets?.forEach((b) => bullet(ctx, b));
      ctx.y += 4;
    });
  }

  if (cv.education?.length) {
    sectionHeading(ctx, "Education", template);
    cv.education.forEach((ed) => {
      writeText(ctx, `${ed.degree} — ${ed.school}`, { size: 11, bold: true, gap: 2 });
      const sub = [ed.location, [ed.start, ed.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join("  |  ");
      if (sub) writeText(ctx, sub, { size: 10, italic: true, gap: 3 });
      ed.details?.forEach((d) => bullet(ctx, d));
      ctx.y += 4;
    });
  }

  if (cv.skills?.length) {
    sectionHeading(ctx, "Skills", template);
    writeText(ctx, cv.skills.join(", "), { size: 10, gap: 6 });
  }

  if (cv.projects?.length) {
    sectionHeading(ctx, "Projects", template);
    cv.projects.forEach((p) => {
      writeText(ctx, p.name, { size: 11, bold: true, gap: 2 });
      if (p.description) writeText(ctx, p.description, { size: 10, gap: 3 });
      p.bullets?.forEach((b) => bullet(ctx, b));
      ctx.y += 4;
    });
  }

  if (cv.certifications?.length) {
    sectionHeading(ctx, "Certifications", template);
    cv.certifications.forEach((c) => bullet(ctx, c));
  }

  doc.save(filename);
}

export function exportTextPdf(text: string, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), margin: 56 };
  const ctx: Ctx = { doc, y: page.margin, page };
  text.split(/\n\n+/).forEach((para) => {
    writeText(ctx, para.replace(/\n/g, " "), { size: 11, gap: 8 });
  });
  doc.save(filename);
}
