import { Plus, Trash2 } from "lucide-react";
import { usePlaygroundStore } from "../store/usePlaygroundStore";

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-1.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900/40 focus:ring-2 focus:ring-neutral-900/15 dark:border-white/15 dark:bg-[#1e1e1e] dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/15";

export function HeadersEditor() {
  const headers = usePlaygroundStore((state) => state.headers);
  const addHeader = usePlaygroundStore((state) => state.addHeader);
  const updateHeader = usePlaygroundStore((state) => state.updateHeader);
  const removeHeader = usePlaygroundStore((state) => state.removeHeader);

  return (
    <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
      {headers.length === 0 ? (
        <p className="py-1 text-sm text-neutral-500 dark:text-neutral-400">
          No custom headers. Add one if the API requires it.
        </p>
      ) : (
        <ul className="space-y-2">
          {headers.map((header) => (
            <li key={header.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(event) =>
                  updateHeader(header.id, { enabled: event.target.checked })
                }
                className="h-4 w-4 shrink-0 accent-neutral-900 dark:accent-white"
                aria-label={`Enable header ${header.key || "unnamed"}`}
              />
              <input
                type="text"
                value={header.key}
                onChange={(event) =>
                  updateHeader(header.id, { key: event.target.value })
                }
                placeholder="Header name"
                aria-label="Header name"
                className={inputClass}
              />
              <input
                type="text"
                value={header.value}
                onChange={(event) =>
                  updateHeader(header.id, { value: event.target.value })
                }
                placeholder="Value"
                aria-label="Header value"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeHeader(header.id)}
                className="shrink-0 p-1.5 text-neutral-400 transition hover:bg-black/5 hover:text-rose-600 dark:text-neutral-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                aria-label={`Remove header ${header.key || "unnamed"}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={addHeader}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-neutral-900 transition hover:bg-black/5 dark:text-neutral-100 dark:hover:bg-[#3a3a3a]"
        >
          <Plus size={16} />
          Add header
        </button>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Values are kept out of saved history.
        </p>
      </div>
    </div>
  );
}
