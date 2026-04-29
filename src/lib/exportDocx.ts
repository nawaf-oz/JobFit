"use client";

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import type { CVData, Template } from "./types";

function heading(text: string, template: Template): Paragraph {
  if (template === "modern") {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true })],
    });
  }
  if (template === "compact") {
    return new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22 })],
    });
  }
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun(text)],
  });
}

function line(text: string, opts: { bold?: boolean; italic?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic })],
  });
}

export async function exportDocx(cv: CVData, template: Template, filename: string) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: template === "modern" ? AlignmentType.LEFT : AlignmentType.CENTER,
      children: [new TextRun({ text: cv.name || "Your Name", bold: true, size: 32 })],
    }),
  );

  const contactBits = [
    cv.contact.email,
    cv.contact.phone,
    cv.contact.location,
    ...(cv.contact.links ?? []),
  ].filter(Boolean);
  if (contactBits.length) {
    children.push(
      new Paragraph({
        alignment: template === "modern" ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun(contactBits.join(" | "))],
      }),
    );
  }

  if (cv.summary) {
    children.push(heading("Summary", template));
    children.push(line(cv.summary));
  }

  if (cv.experience?.length) {
    children.push(heading("Experience", template));
    cv.experience.forEach((e) => {
      children.push(line(`${e.title} — ${e.company}`, { bold: true }));
      const sub = [e.location, [e.start, e.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join(" | ");
      if (sub) children.push(line(sub, { italic: true }));
      e.bullets?.forEach((b) => children.push(bullet(b)));
    });
  }

  if (cv.education?.length) {
    children.push(heading("Education", template));
    cv.education.forEach((ed) => {
      children.push(line(`${ed.degree} — ${ed.school}`, { bold: true }));
      const sub = [ed.location, [ed.start, ed.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join(" | ");
      if (sub) children.push(line(sub, { italic: true }));
      ed.details?.forEach((d) => children.push(bullet(d)));
    });
  }

  if (cv.skills?.length) {
    children.push(heading("Skills", template));
    children.push(line(cv.skills.join(", ")));
  }

  if (cv.projects?.length) {
    children.push(heading("Projects", template));
    cv.projects.forEach((p) => {
      children.push(line(p.name, { bold: true }));
      if (p.description) children.push(line(p.description));
      p.bullets?.forEach((b) => children.push(bullet(b)));
    });
  }

  if (cv.certifications?.length) {
    children.push(heading("Certifications", template));
    cv.certifications.forEach((c) => children.push(bullet(c)));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export async function exportTextDocx(text: string, filename: string) {
  const paragraphs = text.split(/\n\n+/).map(
    (p) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun(p.replace(/\n/g, " "))],
      }),
  );
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children: paragraphs,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
