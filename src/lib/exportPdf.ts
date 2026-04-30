"use client";

import { jsPDF } from "jspdf";
import type { CVData, Template } from "./types";

const LINE_HEIGHT = 1.25;

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
  opts: {
    size?: number;
    bold?: boolean;
    italic?: boolean;
    align?: "left" | "center";
    color?: [number, number, number];
    gap?: number;
    indent?: number;
  } = {},
) {
  const { size = 10.5, bold, italic, align = "left", color, gap = 4, indent = 0 } = opts;
  const style = bold ? (italic ? "bolditalic" : "bold") : italic ? "italic" : "normal";
  ctx.doc.setFont("helvetica", style);
  ctx.doc.setFontSize(size);
  if (color) ctx.doc.setTextColor(color[0], color[1], color[2]);
  else ctx.doc.setTextColor(20, 20, 20);

  const maxWidth = ctx.page.width - ctx.page.margin * 2 - indent;
  const lines = ctx.doc.splitTextToSize(text, maxWidth);
  const lineH = size * LINE_HEIGHT;
  newPageIfNeeded(ctx, lines.length * lineH + gap);

  const baselineY = ctx.y + size;
  const x = align === "center" ? ctx.page.width / 2 : ctx.page.margin + indent;
  ctx.doc.text(lines, x, baselineY, { align, lineHeightFactor: LINE_HEIGHT });

  ctx.y = baselineY + (lines.length - 1) * lineH + gap;
}

function rule(ctx: Ctx, color: [number, number, number] = [180, 180, 180]) {
  ctx.doc.setDrawColor(color[0], color[1], color[2]);
  ctx.doc.setLineWidth(0.6);
  ctx.doc.line(ctx.page.margin, ctx.y, ctx.page.width - ctx.page.margin, ctx.y);
  ctx.y += 6;
}

function sectionHeading(ctx: Ctx, text: string, template: Template) {
  ctx.y += 6;
  if (template === "modern") {
    writeText(ctx, text.toUpperCase(), { size: 11, bold: true, color: [70, 70, 200], gap: 3 });
    rule(ctx, [70, 70, 200]);
    return;
  }
  if (template === "compact") {
    writeText(ctx, text.toUpperCase(), { size: 10.5, bold: true, gap: 4 });
    return;
  }
  writeText(ctx, text, { size: 12.5, bold: true, gap: 4 });
  rule(ctx);
}

function writeContactLine(
  ctx: Ctx,
  baseBits: string[],
  links: { label: string; url: string }[],
  template: "classic" | "modern" | "compact",
) {
  const size = 9.5;
  const sep = "  |  ";
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(size);

  const parts: { text: string; href?: string }[] = [];
  baseBits.forEach((b, i) => {
    parts.push({ text: b });
    if (i < baseBits.length - 1 || links.length > 0) parts.push({ text: sep });
  });
  links.forEach((l, i) => {
    parts.push({ text: l.label || l.url, href: l.url || undefined });
    if (i < links.length - 1) parts.push({ text: sep });
  });

  const totalWidth = parts.reduce(
    (sum, p) => sum + ctx.doc.getStringUnitWidth(p.text) * size,
    0,
  );
  const baselineY = ctx.y + size;
  let x =
    template === "modern"
      ? ctx.page.margin
      : (ctx.page.width - totalWidth) / 2;

  parts.forEach((p) => {
    if (p.href) {
      ctx.doc.setTextColor(80, 60, 180);
      ctx.doc.textWithLink(p.text, x, baselineY, { url: p.href });
    } else {
      ctx.doc.setTextColor(90, 90, 90);
      ctx.doc.text(p.text, x, baselineY);
    }
    x += ctx.doc.getStringUnitWidth(p.text) * size;
  });
  ctx.doc.setTextColor(20, 20, 20);
  ctx.y = baselineY + 8;
}

function bullet(ctx: Ctx, text: string) {
  const size = 10;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(size);
  ctx.doc.setTextColor(20, 20, 20);

  const dotX = ctx.page.margin + 4;
  const textIndent = 14;
  const maxWidth = ctx.page.width - ctx.page.margin * 2 - textIndent;
  const lines = ctx.doc.splitTextToSize(text, maxWidth);
  const lineH = size * LINE_HEIGHT;
  newPageIfNeeded(ctx, lines.length * lineH + 3);

  const baselineY = ctx.y + size;
  ctx.doc.text("•", dotX, baselineY);
  ctx.doc.text(lines, ctx.page.margin + textIndent, baselineY, { lineHeightFactor: LINE_HEIGHT });
  ctx.y = baselineY + (lines.length - 1) * lineH + 3;
}

export function exportPdf(cv: CVData, template: Template, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setLineHeightFactor(LINE_HEIGHT);

  const page = {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    margin: 50,
  };
  const ctx: Ctx = { doc, y: page.margin, page };

  const headerColor: [number, number, number] | undefined =
    template === "modern" ? [40, 40, 120] : undefined;

  writeText(ctx, cv.name || "Your Name", {
    size: 22,
    bold: true,
    align: template === "modern" ? "left" : "center",
    color: headerColor,
    gap: 4,
  });

  const baseBits = [cv.contact.email, cv.contact.phone, cv.contact.location].filter(Boolean) as string[];
  const links = cv.contact.links ?? [];
  if (baseBits.length || links.length) {
    writeContactLine(ctx, baseBits, links, template);
  }

  if (cv.summary) {
    sectionHeading(ctx, "Summary", template);
    writeText(ctx, cv.summary, { size: 10, gap: 6 });
  }

  if (cv.experience?.length) {
    sectionHeading(ctx, "Experience", template);
    cv.experience.forEach((e, i) => {
      writeText(ctx, `${e.title} — ${e.company}`, { size: 11, bold: true, gap: 2 });
      const sub = [e.location, [e.start, e.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join(" | ");
      if (sub) writeText(ctx, sub, { size: 9.5, italic: true, color: [110, 110, 110], gap: 4 });
      e.bullets?.forEach((b) => bullet(ctx, b));
      if (i < cv.experience.length - 1) ctx.y += 4;
    });
  }

  if (cv.education?.length) {
    sectionHeading(ctx, "Education", template);
    cv.education.forEach((ed, i) => {
      writeText(ctx, `${ed.degree} — ${ed.school}`, { size: 11, bold: true, gap: 2 });
      const sub = [ed.location, [ed.start, ed.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join(" | ");
      if (sub) writeText(ctx, sub, { size: 9.5, italic: true, color: [110, 110, 110], gap: 4 });
      ed.details?.forEach((d) => bullet(ctx, d));
      if (i < cv.education.length - 1) ctx.y += 4;
    });
  }

  if (cv.skills?.length) {
    sectionHeading(ctx, "Skills", template);
    writeText(ctx, cv.skills.join(", "), { size: 10, gap: 6 });
  }

  if (cv.projects?.length) {
    sectionHeading(ctx, "Projects", template);
    cv.projects.forEach((p, i) => {
      writeText(ctx, p.name, { size: 11, bold: true, gap: 2 });
      if (p.description) writeText(ctx, p.description, { size: 10, gap: 4 });
      p.bullets?.forEach((b) => bullet(ctx, b));
      if (i < cv.projects!.length - 1) ctx.y += 4;
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
  doc.setLineHeightFactor(LINE_HEIGHT);
  const page = {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    margin: 64,
  };
  const ctx: Ctx = { doc, y: page.margin, page };

  text.split(/\n\n+/).forEach((block) => {
    block.split("\n").forEach((line) => {
      const trimmed = line.trim();
      const isHeading =
        /^(re:|dear |sincerely,|best regards,|kind regards,|yours sincerely,|yours faithfully,)/i.test(
          trimmed,
        );
      writeText(ctx, line || " ", {
        size: 11,
        bold: isHeading,
        gap: 2,
      });
    });
    ctx.y += 8;
  });
  doc.save(filename);
}
