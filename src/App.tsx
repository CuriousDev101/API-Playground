import { useEffect } from "react";
import { Moon, Sun, Zap } from "lucide-react";
import { RequestBar } from "./components/RequestBar";
import { ResponsePanel } from "./components/ResponsePanel";
import { HistorySidebar } from "./components/HistorySidebar";
import { usePlaygroundStore } from "./store/usePlaygroundStore";

function App() {
  const theme = usePlaygroundStore((state) => state.theme);
  const toggleTheme = usePlaygroundStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="min-h-screen bg-[#f6f5f4] text-neutral-900 dark:bg-[#242424] dark:text-neutral-100">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#303030]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center bg-black text-white dark:bg-white dark:text-[#242424]">
            <Zap size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight">API Playground</h1>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              Send a request, inspect the response all in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="ml-auto border border-black/15 p-2 text-neutral-600 transition hover:bg-black/5 dark:border-white/15 dark:text-neutral-100 dark:hover:bg-[#3a3a3a]"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <RequestBar />
          <ResponsePanel />
        </div>
        <HistorySidebar />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 pt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
        Phase 1 · requests are sent straight from your browser, so some APIs may
        block cross-origin calls.
      </footer>
    </div>
  );
}

export default App;
