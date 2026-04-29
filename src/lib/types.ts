export type CVData = {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: string[];
  };
  summary: string;
  experience: {
    title: string;
    company: string;
    location?: string;
    start: string;
    end: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    location?: string;
    start: string;
    end: string;
    details?: string[];
  }[];
  skills: string[];
  projects?: {
    name: string;
    description: string;
    bullets?: string[];
  }[];
  certifications?: string[];
};

export type ScreeningQuestion = {
  id: string;
  question: string;
  reason: string;
  options: string[];
};

export type ScreeningAnswer = {
  id: string;
  answer: string;
};

export type Template = "classic" | "modern" | "compact";

export type Provider = "anthropic" | "openai" | "gemini";

export type ProviderConfig = {
  provider: Provider;
  apiKey: string;
};

