import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ClipboardPaste, Send, X } from "lucide-react";
import { HeadersEditor } from "./HeadersEditor";
import { RequestBodyEditor } from "./RequestBodyEditor";
import { cx } from "../lib/format";
import { usePlaygroundStore } from "../store/usePlaygroundStore";
import type { HttpMethod } from "../types";
import { HTTP_METHODS, methodHasBody } from "../types";

const METHOD_TEXT: Record<HttpMethod, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-violet-600 dark:text-violet-400",
  DELETE: "text-rose-600 dark:text-rose-400",
};

export function RequestBar() {
  const url = usePlaygroundStore((state) => state.url);
  const method = usePlaygroundStore((state) => state.method);
  const body = usePlaygroundStore((state) => state.body);
  const status = usePlaygroundStore((state) => state.status);
  const error = usePlaygroundStore((state) => state.error);
  const headers = usePlaygroundStore((state) => state.headers);
  const headersOpen = usePlaygroundStore((state) => state.headersOpen);
  const setUrl = usePlaygroundStore((state) => state.setUrl);
  const setMethod = usePlaygroundStore((state) => state.setMethod);
  const send = usePlaygroundStore((state) => state.send);
  const cancel = usePlaygroundStore((state) => state.cancel);
  const setHeadersOpen = usePlaygroundStore((state) => state.setHeadersOpen);

  const [bodyOpen, setBodyOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loading = status === "loading";
  const supportsBody = methodHasBody(method);
  const activeHeaderCount = headers.filter(
    (header) => header.enabled && header.key.trim(),
  ).length;

  const toggleClass = (active: boolean) =>
    cx(
      "inline-flex items-center gap-1.5 border px-3 py-2.5 text-sm font-medium transition",
      active
        ? "border-indigo-300 bg-indigo-50 text-black dark:border-black/10 dark:bg-black/10 dark:text-white"
        : "border-slate-300 text-black hover:opacity-80 dark:border-white/15 dark:text-white dark:hover:bg-[#3a3a3a]",
    );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!loading) void send();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (trimmed) setUrl(trimmed);
    } catch {
      // Clipboard access denied or unavailable; focus so the user can paste.
    } finally {
      inputRef.current?.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#303030] sm:p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center border border-slate-300 bg-white transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:border-white/15 dark:bg-[#1e1e1e] dark:focus-within:border-white/40 dark:focus-within:ring-white/15">
          <label htmlFor="request-method" className="sr-only">
            HTTP method
          </label>
          <select
            id="request-method"
            value={method}
            onChange={(event) => {
              const next = event.target.value as HttpMethod;
              setMethod(next);
              if (!methodHasBody(next)) setBodyOpen(false);
            }}
            className={cx(
              "mr-1 cursor-pointer bg-transparent py-2.5 pl-3 pr-1 text-xs font-bold tracking-wide outline-none",
              METHOD_TEXT[method],
            )}
          >
            {HTTP_METHODS.map((value) => (
              <option
                key={value}
                value={value}
                className="bg-white text-neutral-900 dark:bg-[#1e1e1e] dark:text-white"
              >
                {value}
              </option>
            ))}
          </select>

          <label htmlFor="request-url" className="sr-only">
            Request URL
          </label>
          <input
            ref={inputRef}
            id="request-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.github.com/users/octocat"
            aria-invalid={error?.kind === "invalid-url"}
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-neutral-500"
          />
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handlePaste}
            title="Paste from clipboard"
            aria-label="Paste URL from clipboard"
            className="mr-1 p-1.5 text-slate-400 transition hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white"
          >
            <ClipboardPaste size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHeadersOpen(!headersOpen)}
            aria-expanded={headersOpen}
            aria-controls="headers-editor"
            className={toggleClass(headersOpen)}
          >
            Headers
            {activeHeaderCount > 0 && (
              <span className="bg-indigo-600 px-1.5 text-xs font-semibold text-white dark:bg-white dark:text-[#242424]">
                {activeHeaderCount}
              </span>
            )}
            <ChevronDown
              size={16}
              className={cx("transition-transform", headersOpen && "rotate-180")}
            />
          </button>

          {supportsBody && (
            <button
              type="button"
              onClick={() => setBodyOpen(!bodyOpen)}
              aria-expanded={bodyOpen}
              aria-controls="request-body"
              className={toggleClass(bodyOpen)}
            >
              Body
              {body.trim() && (
                <span className="h-1.5 w-1.5 bg-indigo-500 dark:bg-white" />
              )}
              <ChevronDown
                size={16}
                className={cx(
                  "transition-transform",
                  bodyOpen && "rotate-180",
                )}
              />
            </button>
          )}

          {loading ? (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-[#3a3a3a] dark:hover:bg-[#474747]"
            >
              <X size={16} />
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#242424] dark:hover:bg-white/90 dark:focus-visible:outline-white"
            >
              <Send size={16} />
              Send
            </button>
          )}
        </div>
      </div>

      {error?.kind === "invalid-url" && (
        <p role="alert" className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
          {error.message}
        </p>
      )}

      {headersOpen && (
        <div id="headers-editor">
          <HeadersEditor />
        </div>
      )}

      {supportsBody && bodyOpen && (
        <div id="request-body">
          <RequestBodyEditor />
        </div>
      )}
    </form>
  );
}
