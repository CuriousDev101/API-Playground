import { useEffect, useState } from "react";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import json from "shiki/langs/json.mjs";
import rosePineDawn from "shiki/themes/rose-pine-dawn.mjs";
import rosePineMoon from "shiki/themes/rose-pine-moon.mjs";

interface CodeHighlightProps {
  code: string;
  language: string;
}

interface Rendered {
  html: string;
  code: string;
  language: string;
}

const THEMES = { light: "rose-pine-dawn", dark: "rose-pine-moon" } as const;

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    langs: [json],
    themes: [rosePineDawn, rosePineMoon],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

export default function CodeHighlight({
  code,
  language,
}: CodeHighlightProps) {
  const [rendered, setRendered] = useState<Rendered | null>(null);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((highlighter) => highlighter.codeToHtml(code, { lang: language, themes: THEMES }))
      .then((html) => {
        if (!cancelled) setRendered({ html, code, language });
      })
      .catch((error) => {
        console.warn("Failed to highlight code:", error);
        if (!cancelled) setRendered(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const containerClass =
    "overflow-auto border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed dark:border-white/10 dark:bg-[#1e1e1e] [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words";

  const current =
    rendered && rendered.code === code && rendered.language === language
      ? rendered.html
      : null;

  if (!current) {
    return (
      <div className={containerClass}>
        <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-neutral-100">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={containerClass}
      dangerouslySetInnerHTML={{ __html: current }}
    />
  );
}
