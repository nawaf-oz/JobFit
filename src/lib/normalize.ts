import type { ContactLink, CVData } from "./types";

function normalizeLinks(raw: unknown): ContactLink[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((item): ContactLink | null => {
      if (typeof item === "string") {
        const url = item.trim();
        if (!url) return null;
        return { label: deriveLabel(url), url };
      }
      if (typeof item === "object" && item !== null) {
        const o = item as Record<string, unknown>;
        const url = typeof o.url === "string" ? o.url.trim() : typeof o.href === "string" ? o.href.trim() : "";
        const label = typeof o.label === "string" && o.label.trim()
          ? o.label.trim()
          : typeof o.name === "string" && o.name.trim()
          ? o.name.trim()
          : url
          ? deriveLabel(url)
          : "";
        if (!url && !label) return null;
        return { label: label || deriveLabel(url), url };
      }
      return null;
    })
    .filter((x): x is ContactLink => x !== null);
}

function deriveLabel(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("github.com")) return "GitHub";
  if (u.includes("linkedin.com")) return "LinkedIn";
  if (u.includes("twitter.com") || u.includes("x.com")) return "Twitter";
  if (u.includes("stackoverflow.com")) return "Stack Overflow";
  if (u.includes("dribbble.com")) return "Dribbble";
  if (u.includes("behance.net")) return "Behance";
  return "Link";
}

function toStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.name === "string") return o.name;
    if (typeof o.skill === "string") return o.skill;
    if (typeof o.title === "string") return o.title;
    if (typeof o.value === "string") return o.value;
    return Object.values(o).filter((x) => typeof x === "string").join(" ").trim();
  }
  return String(v);
}

function flattenSkills(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (Array.isArray(item)) return flattenSkills(item);
      if (typeof item === "object" && item !== null) {
        const o = item as Record<string, unknown>;
        if (Array.isArray(o.items)) return flattenSkills(o.items);
        if (Array.isArray(o.skills)) return flattenSkills(o.skills);
        const name = toStr(o);
        return name ? [name] : [];
      }
      return [String(item)];
    }).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).flatMap((v) => flattenSkills(v));
  }
  return [String(raw)];
}

export function normalizeCV(cv: CVData): CVData {
  return {
    ...cv,
    name: toStr(cv.name),
    contact: {
      email: cv.contact?.email ? toStr(cv.contact.email) : undefined,
      phone: cv.contact?.phone ? toStr(cv.contact.phone) : undefined,
      location: cv.contact?.location ? toStr(cv.contact.location) : undefined,
      links: normalizeLinks(cv.contact?.links),
    },
    summary: toStr(cv.summary),
    skills: flattenSkills(cv.skills as unknown),
    experience: (cv.experience ?? []).map((e) => ({
      title: toStr(e.title),
      company: toStr(e.company),
      location: e.location ? toStr(e.location) : undefined,
      start: toStr(e.start),
      end: toStr(e.end),
      bullets: (e.bullets ?? []).map(toStr).filter(Boolean),
    })),
    education: (cv.education ?? []).map((ed) => ({
      degree: toStr(ed.degree),
      school: toStr(ed.school),
      location: ed.location ? toStr(ed.location) : undefined,
      start: toStr(ed.start),
      end: toStr(ed.end),
      details: (ed.details ?? []).map(toStr).filter(Boolean),
    })),
    projects: (cv.projects ?? []).map((p) => ({
      name: toStr(p.name),
      description: toStr(p.description),
      bullets: (p.bullets ?? []).map(toStr).filter(Boolean),
    })),
    certifications: (cv.certifications ?? []).map(toStr).filter(Boolean),
  };
}
