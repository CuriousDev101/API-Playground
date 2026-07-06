import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RequestError, sendRequest, validateUrl } from "../lib/http";
import type {
  HistoryItem,
  HttpMethod,
  PlaygroundError,
  RequestHeader,
  ResponseData,
  ResponseTab,
  RequestStatus,
  Theme,
} from "../types";
import { ERROR_MESSAGES, HISTORY_LIMIT } from "../types";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createHeader(): RequestHeader {
  return { id: makeId(), key: "", value: "", enabled: true };
}

interface PlaygroundState {
  url: string;
  method: HttpMethod;
  body: string;
  headers: RequestHeader[];
  history: HistoryItem[];
  response: ResponseData | null;
  error: PlaygroundError | null;
  status: RequestStatus;
  activeTab: ResponseTab;
  headersOpen: boolean;
  theme: Theme;

  setUrl: (url: string) => void;
  setMethod: (method: HttpMethod) => void;
  setBody: (body: string) => void;
  addHeader: () => void;
  updateHeader: (
    id: string,
    patch: Partial<Pick<RequestHeader, "key" | "value" | "enabled">>,
  ) => void;
  removeHeader: (id: string) => void;
  clearHeaders: () => void;

  setActiveTab: (tab: ResponseTab) => void;
  setHeadersOpen: (open: boolean) => void;
  toggleTheme: () => void;

  send: () => Promise<void>;
  cancel: () => void;

  loadFromHistory: (id: string) => void;
  reRun: (id: string) => Promise<void>;
  deleteHistory: (id: string) => void;
  clearHistory: () => void;
}

let activeController: AbortController | null = null;

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => ({
      url: "",
      method: "GET",
      body: "",
      headers: [],
      history: [],
      response: null,
      error: null,
      status: "idle",
      activeTab: "body",
      headersOpen: false,
      theme:
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",

      setUrl: (url) =>
        set((state) => ({
          url,
          error: state.error?.kind === "invalid-url" ? null : state.error,
        })),

      setMethod: (method) => set({ method }),
      setBody: (body) => set({ body }),

      addHeader: () =>
        set((state) => ({ headers: [...state.headers, createHeader()] })),

      updateHeader: (id, patch) =>
        set((state) => ({
          headers: state.headers.map((header) =>
            header.id === id ? { ...header, ...patch } : header,
          ),
        })),

      removeHeader: (id) =>
        set((state) => ({
          headers: state.headers.filter((header) => header.id !== id),
        })),

      clearHeaders: () => set({ headers: [] }),

      setActiveTab: (activeTab) => set({ activeTab }),
      setHeadersOpen: (headersOpen) => set({ headersOpen }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      send: async () => {
        const { url, method, headers, body } = get();
        const validationError = validateUrl(url);
        if (validationError) {
          set({
            status: "error",
            response: null,
            error: { kind: "invalid-url", message: validationError },
          });
          return;
        }

        const target = url.trim();
        const controller = new AbortController();
        activeController = controller;
        set({ status: "loading", response: null, error: null, activeTab: "body" });

        const startedAt = performance.now();
        try {
          const response = await sendRequest(target, {
            method,
            headers,
            body,
            signal: controller.signal,
          });
          const item: HistoryItem = {
            id: makeId(),
            method,
            url: target,
            body: body.trim() ? body : undefined,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            durationMs: response.durationMs,
            sizeBytes: response.sizeBytes,
            timestamp: Date.now(),
          };
          set((state) => ({
            status: "success",
            response,
            error: null,
            history: [item, ...state.history].slice(0, HISTORY_LIMIT),
          }));
        } catch (error) {
          const requestError =
            error instanceof RequestError
              ? error
              : new RequestError("unknown", ERROR_MESSAGES.unknown);

          if (requestError.kind === "cancelled") {
            set({ status: "idle", response: null, error: null });
            return;
          }

          const item: HistoryItem = {
            id: makeId(),
            method,
            url: target,
            body: body.trim() ? body : undefined,
            status: null,
            statusText: "",
            ok: false,
            durationMs: performance.now() - startedAt,
            sizeBytes: 0,
            timestamp: Date.now(),
          };
          set((state) => ({
            status: "error",
            response: null,
            error: { kind: requestError.kind, message: requestError.message },
            history: [item, ...state.history].slice(0, HISTORY_LIMIT),
          }));
        } finally {
          if (activeController === controller) activeController = null;
        }
      },

      cancel: () => {
        activeController?.abort();
      },

      loadFromHistory: (id) => {
        const item = get().history.find((entry) => entry.id === id);
        if (!item) return;
        set({
          url: item.url,
          method: item.method,
          body: item.body ?? "",
          status: "idle",
          response: null,
          error: null,
          activeTab: "body",
        });
      },

      reRun: async (id) => {
        get().loadFromHistory(id);
        await get().send();
      },

      deleteHistory: (id) =>
        set((state) => ({
          history: state.history.filter((entry) => entry.id !== id),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "api-ground",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        history: state.history,
        theme: state.theme,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PlaygroundState>;
        const history = Array.isArray(saved.history)
          ? saved.history.filter(
              (item): item is HistoryItem =>
                !!item && typeof item.url === "string",
            )
          : [];
        const theme: Theme = saved.theme === "dark" ? "dark" : current.theme;
        return {
          ...current,
          history: history.slice(0, HISTORY_LIMIT),
          theme,
        };
      },
    },
  ),
);
