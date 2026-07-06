import { useEffect, useState } from "react";
import { Check, Clock, Copy, Inbox, TriangleAlert } from "lucide-react";
import type { ResponseTab } from "../types";
import { StatusBadge } from "./StatusBadge";
import { cx, formatBytes, formatDuration, formatJson } from "../lib/format";
import { usePlaygroundStore } from "../store/usePlaygroundStore";
import CodeHighlight from "./CodeHighlight";

const CORS_HINTS = new Set(["cors", "network"]);

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400 dark:bg-[#1e1e1e] dark:text-neutral-500">
        <Inbox size={24} />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-neutral-200">
        No response yet
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-400 dark:text-neutral-500">
        Enter a URL and press Send to see the response here.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-white/20 dark:border-t-white" />
      <p className="text-sm font-medium text-slate-600 dark:text-neutral-200">
        Sending request…
      </p>
    </div>
  );
}

function ErrorState() {
  const error = usePlaygroundStore((state) => state.error);
  if (!error) return null;
  const showHint = CORS_HINTS.has(error.kind);
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
        <TriangleAlert size={24} />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">
        Request failed
      </p>
      <p role="alert" className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-neutral-300">
        {error.message}
      </p>
      {showHint && (
        <p className="mx-auto mt-3 max-w-md bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-[#1e1e1e] dark:text-neutral-400">
          Browsers block cross-origin calls the API doesn't allow and custom
          headers trigger a preflight that some APIs reject. Try{" "}
          <code className="font-mono">https://api.github.com/users/octocat</code>{" "}
          to confirm the app works.
        </p>
      )}
    </div>
  );
}

function HeaderTable() {
  const response = usePlaygroundStore((state) => state.response);
  if (!response) return null;
  if (response.headers.length === 0) {
    return (
      <p className="p-6 text-sm text-slate-500 dark:text-neutral-400">
        No response headers were exposed.
      </p>
    );
  }
  return (
    <dl className="divide-y divide-slate-100 dark:divide-white/10">
      {response.headers.map((header) => (
        <div key={header.key} className="grid grid-cols-1 gap-1 px-4 py-2 sm:grid-cols-[220px_1fr] sm:gap-4">
          <dt className="font-mono text-xs font-semibold break-all text-slate-500 dark:text-neutral-400">
            {header.key}
          </dt>
          <dd className="font-mono text-xs break-all text-slate-800 dark:text-neutral-100">
            {header.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const MAX_HIGHLIGHT_CHARS = 200_000;

function ResponseBody() {
  const response = usePlaygroundStore((state) => state.response);
  if (!response) return null;

  if (!response.body) {
    return (
      <p className="p-6 text-sm text-slate-500 dark:text-neutral-400">
        Empty response body.
      </p>
    );
  }

  const code = response.isJson ? formatJson(response.json) : response.body;

  if (code.length > MAX_HIGHLIGHT_CHARS) {
    return (
      <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-neutral-100">
        {code}
      </pre>
    );
  }

  return (
    <CodeHighlight code={code} language={response.isJson ? "json" : "text"} />
  );
}

export function ResponsePanel() {
  const response = usePlaygroundStore((state) => state.response);
  const status = usePlaygroundStore((state) => state.status);
  const error = usePlaygroundStore((state) => state.error);
  const activeTab = usePlaygroundStore((state) => state.activeTab);
  const setActiveTab = usePlaygroundStore((state) => state.setActiveTab);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!response) return;
    const text = response.isJson ? formatJson(response.json) : response.body;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const tabs: { id: ResponseTab; label: string }[] = [
    { id: "body", label: "Body" },
    { id: "headers", label: "Headers" },
  ];

  return (
    <section
      aria-label="Response"
      className="flex max-h-[70vh] min-h-80 flex-col overflow-hidden border border-black/10 bg-white shadow-sm lg:max-h-[calc(100vh-13rem)] dark:border-white/10 dark:bg-[#303030]"
    >
      {response && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
          <StatusBadge status={response.status} statusText={response.statusText} />
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock size={14} />
            <span className="tabular-nums">{formatDuration(response.durationMs)}</span>
          </span>
          <span className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
            {formatBytes(response.sizeBytes)}
          </span>
          {response.contentType && (
            <span className="hidden truncate text-xs text-neutral-400 sm:inline dark:text-neutral-500">
              {response.contentType}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Response view"
              className="flex bg-black/5 p-0.5 dark:bg-[#1e1e1e]"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cx(
                    "px-3 py-1 text-xs font-medium transition",
                    activeTab === tab.id
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white/15 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-black/5 dark:border-white/15 dark:text-neutral-100 dark:hover:bg-[#3a3a3a]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {status === "loading" ? (
          <LoadingState />
        ) : status === "error" && error ? (
          <ErrorState />
        ) : response ? (
          activeTab === "body" ? (
            <ResponseBody />
          ) : (
            <HeaderTable />
          )
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
