"use client";

import { useEffect, useState } from "react";
import { PROVIDER_CONSOLE, PROVIDER_KEY_HINT, PROVIDER_LABEL } from "@/lib/ai";
import type { Provider, ProviderConfig } from "@/lib/types";

const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

type Props = {
  config: ProviderConfig;
  setConfig: (c: ProviderConfig) => void;
};

const keyStorageKey = (p: Provider) => `jobfit_key_${p}`;

export default function ApiKeyBox({ config, setConfig }: Props) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(config.apiKey);

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
  };

  const clear = () => {
    setDraft("");
    localStorage.removeItem(keyStorageKey(config.provider));
    setConfig({ provider: config.provider, apiKey: "" });
  };

  return (
    <section className="rounded-md border border-black/10 dark:border-white/15 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">AI Provider</h2>
        <span className="text-xs opacity-60">
          {config.apiKey ? "Key saved" : "Key required"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => onProviderChange(p)}
            className={`rounded border p-2 text-xs ${
              config.provider === p
                ? "border-black dark:border-white font-medium"
                : "border-black/15 dark:border-white/20 opacity-80"
            }`}
          >
            {PROVIDER_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type={show ? "text" : "password"}
          placeholder={PROVIDER_KEY_HINT[config.provider]}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />
        <button
          onClick={() => setShow((s) => !s)}
          className="rounded border border-black/15 dark:border-white/20 px-3 text-xs"
        >
          {show ? "Hide" : "Show"}
        </button>
        <button
          onClick={save}
          className="rounded bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-xs font-medium"
        >
          Save
        </button>
        {config.apiKey && (
          <button onClick={clear} className="rounded px-3 text-xs underline opacity-70">
            Clear
          </button>
        )}
      </div>

      <p className="mt-2 text-xs opacity-60">
        Get a key from{" "}
        <a
          href={PROVIDER_CONSOLE[config.provider]}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {PROVIDER_CONSOLE[config.provider]}
        </a>
        . Stored locally in your browser. Sent only to the selected provider.
      </p>
    </section>
  );
}
