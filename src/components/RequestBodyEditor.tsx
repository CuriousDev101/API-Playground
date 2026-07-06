import { useState } from "react";
import { usePlaygroundStore } from "../store/usePlaygroundStore";

const textareaClass =
  "mt-2 w-full resize-y border border-black/15 bg-white px-2.5 py-2 font-mono text-xs text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900/40 focus:ring-2 focus:ring-neutral-900/15 dark:border-white/15 dark:bg-[#1e1e1e] dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/15";

export function RequestBodyEditor() {
  const body = usePlaygroundStore((state) => state.body);
  const setBody = usePlaygroundStore((state) => state.setBody);
  const [invalidJson, setInvalidJson] = useState(false);

  const formatJson = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
      setInvalidJson(false);
    } catch {
      setInvalidJson(true);
    }
  };

  return (
    <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Request body
        </span>
        <button
          type="button"
          onClick={formatJson}
          disabled={!body.trim()}
          className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-400 dark:hover:text-white"
        >
          Format JSON
        </button>
      </div>

      <textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setInvalidJson(false);
        }}
        rows={6}
        spellCheck={false}
        placeholder={'{\n  "key": "value"\n}'}
        aria-label="Request body"
        className={textareaClass}
      />

      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        {invalidJson
          ? "That is not valid JSON."
          : "Sent as application/json when the body looks like JSON."}
      </p>
    </div>
  );
}
