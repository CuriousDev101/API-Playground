import { useEffect, useState } from "react";
import { Clock, RotateCcw, Trash2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { timeAgo, truncateMiddle } from "../lib/format";
import { usePlaygroundStore } from "../store/usePlaygroundStore";

export function HistorySidebar() {
  const history = usePlaygroundStore((state) => state.history);
  const loading = usePlaygroundStore((state) => state.status === "loading");
  const activeUrl = usePlaygroundStore((state) => state.url);
  const reRun = usePlaygroundStore((state) => state.reRun);
  const loadFromHistory = usePlaygroundStore((state) => state.loadFromHistory);
  const deleteHistory = usePlaygroundStore((state) => state.deleteHistory);
  const clearHistory = usePlaygroundStore((state) => state.clearHistory);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      aria-label="Request history"
      className="flex max-h-[70vh] flex-col overflow-hidden border border-slate-200 bg-white shadow-sm lg:max-h-[calc(100vh-13rem)] dark:border-white/10 dark:bg-[#303030]"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
          History
          {history.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-neutral-500">
              {history.length}
            </span>
          )}
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs font-medium text-slate-500 transition hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
          >
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-400 dark:bg-[#1e1e1e] dark:text-neutral-500">
            <Clock size={20} />
          </div>
          <p className="text-xs text-slate-400 dark:text-neutral-500">
            Sent requests will appear here and stay after you refresh.
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100 overflow-auto dark:divide-white/10">
          {history.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-2 px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <button
                type="button"
                onClick={() => loadFromHistory(item.id)}
                disabled={loading}
                className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
                title={`Load ${item.url}`}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-[#1e1e1e] dark:text-neutral-300">
                    {item.method}
                  </span>
                  <span className="truncate text-xs font-medium text-slate-700 dark:text-neutral-100">
                    {truncateMiddle(item.url.replace(/^https?:\/\//, ""), 40)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={item.status} statusText={item.statusText} />
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                    {timeAgo(item.timestamp, now)}
                  </span>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => void reRun(item.id)}
                  disabled={loading}
                  aria-label={`Re-run ${item.url}`}
                  className="p-1.5 text-neutral-400 transition hover:bg-black/5 hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-[#3a3a3a] dark:hover:text-white"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteHistory(item.id)}
                  aria-label={`Delete ${item.url} from history`}
                  className="p-1.5 text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 dark:text-neutral-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {activeUrl && history.length > 0 && (
        <p className="border-t border-black/10 px-4 py-2 text-[11px] text-neutral-400 dark:border-white/10 dark:text-neutral-500">
          Tip: click an item to load it, or use the re-run button.
        </p>
      )}
    </aside>
  );
}
