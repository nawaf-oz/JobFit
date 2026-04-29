"use client";

import { useEffect, useState } from "react";
import { PROVIDER_CONSOLE, PROVIDER_KEY_HINT, PROVIDER_LABEL } from "@/lib/ai";
import type { Provider, ProviderConfig } from "@/lib/types";

const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

const PROVIDER_GRADIENT: Record<Provider, string> = {
  anthropic: "from-orange-400 to-amber-500",
  openai: "from-emerald-400 to-teal-500",
  gemini: "from-sky-400 to-indigo-500",
};

type Props = {
  config: ProviderConfig;
  setConfig: (c: ProviderConfig) => void;
};

const keyStorageKey = (p: Provider) => `jobfit_key_${p}`;

export default function ApiKeyBox({ config, setConfig }: Props) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(config.apiKey);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(config.apiKey);
  }, [config.apiKey, config.provider]);

  const onProviderChange = (p: Provider) => {
    const stored = localStorage.getItem(keyStorageKey(p)) ?? "";
    localStorage.setItem("jobfit_provider", p);
    setConfig({ provider: p, apiKey: stored });
  };

  const save = () => {
    localStorage.setItem(keyStorageKey(config.provider), draft);
    setConfig({ provider: config.provider, apiKey: draft });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const clear = () => {
    setDraft("");
    localStorage.removeItem(keyStorageKey(config.provider));
    setConfig({ provider: config.provider, apiKey: "" });
  };

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800">Choose your AI provider</h2>
        {config.apiKey ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Key saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <span className="size-1.5 rounded-full bg-amber-500" /> Key required
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PROVIDERS.map((p) => {
          const active = config.provider === p;
          return (
            <button
              key={p}
              onClick={() => onProviderChange(p)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                active
                  ? "border-transparent shadow-md ring-2 ring-violet-300"
                  : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm"
              }`}
            >
              {active && (
                <div className={`absolute inset-0 bg-gradient-to-br ${PROVIDER_GRADIENT[p]} opacity-95`} />
              )}
              <div className="relative">
                <div className={`text-sm font-semibold ${active ? "text-white" : "text-slate-800"}`}>
                  {PROVIDER_LABEL[p]}
                </div>
                <div className={`mt-0.5 text-[11px] ${active ? "text-white/90" : "text-slate-500"}`}>
                  {p === "anthropic" && "Claude Sonnet 4.5"}
                  {p === "openai" && "GPT-4o"}
                  {p === "gemini" && "Gemini 2.5 Flash"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          type={show ? "text" : "password"}
          placeholder={PROVIDER_KEY_HINT[config.provider]}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="field flex-1"
        />
        <div className="flex gap-2">
          <button onClick={() => setShow((s) => !s)} className="btn-secondary">
            {show ? "Hide" : "Show"}
          </button>
          <button onClick={save} className="btn-primary">
            {savedFlash ? "Saved ✓" : "Save"}
          </button>
          {config.apiKey && (
            <button onClick={clear} className="btn-ghost">
              Clear
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Get a key at{" "}
        <a
          href={PROVIDER_CONSOLE[config.provider]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-violet-700 hover:text-violet-900 hover:underline"
        >
          {PROVIDER_CONSOLE[config.provider].replace("https://", "")}
        </a>
        . Stored locally in your browser only.
      </p>
    </section>
  );
}
