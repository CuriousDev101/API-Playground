import type {
  ErrorKind,
  HttpMethod,
  RequestHeader,
  ResponseData,
  ResponseHeader,
} from "../types";
import { ERROR_MESSAGES, methodHasBody } from "../types";

export const DEFAULT_TIMEOUT_MS = 15_000;

export class RequestError extends Error {
  kind: ErrorKind;

  constructor(kind: ErrorKind, message: string = ERROR_MESSAGES[kind]) {
    super(message);
    this.name = "RequestError";
    this.kind = kind;
  }
}

/**
 * Returns an error message for invalid input, or null when the URL is a valid
 * http/https URL.
 */
export function validateUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return ERROR_MESSAGES["invalid-url"];
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return ERROR_MESSAGES["invalid-url"];
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return ERROR_MESSAGES["invalid-url"];
  }
  return null;
}

function isJsonResponse(contentType: string | null, body: string): boolean {
  if (contentType) {
    const type = contentType.toLowerCase();
    if (type.includes("application/json") || type.includes("+json")) return true;
  }
  const trimmed = body.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function headersToArray(headers: Headers): ResponseHeader[] {
  const list: ResponseHeader[] = [];
  headers.forEach((value, key) => list.push({ key, value }));
  return list.sort((a, b) => a.key.localeCompare(b.key));
}

export interface SendOptions {
  method?: HttpMethod;
  headers?: RequestHeader[];
  body?: string;
  signal: AbortSignal;
  timeoutMs?: number;
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends an HTTP request and resolves with a normalized response. Rejects with a
 * {@link RequestError} describing the failure kind.
 */
export async function sendRequest(
  url: string,
  options: SendOptions,
): Promise<ResponseData> {
  const {
    method = "GET",
    headers = [],
    body: rawBody,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  signal.addEventListener("abort", onExternalAbort);

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const requestHeaders = new Headers();
  let requestBody: string | undefined;
  try {
    for (const header of headers) {
      const key = header.key.trim();
      if (header.enabled && key) {
        requestHeaders.set(key, header.value);
      }
    }

    if (methodHasBody(method) && rawBody && rawBody.trim()) {
      requestBody = rawBody;
      if (!requestHeaders.has("content-type")) {
        requestHeaders.set(
          "Content-Type",
          looksLikeJson(rawBody) ? "application/json" : "text/plain",
        );
      }
    }
  } catch {
    clearTimeout(timer);
    signal.removeEventListener("abort", onExternalAbort);
    throw new RequestError("invalid-header");
  }

  const start = performance.now();
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    const body = await response.text();
    const durationMs = performance.now() - start;
    const sizeBytes = new TextEncoder().encode(body).length;
    const contentType = response.headers.get("content-type");

    const jsonCapable = isJsonResponse(contentType, body);
    let json: unknown = null;
    let isJson = false;
    if (jsonCapable) {
      try {
        json = JSON.parse(body);
        isJson = true;
      } catch {
        isJson = false;
      }
    }

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: headersToArray(response.headers),
      body,
      contentType,
      isJson,
      json,
      durationMs,
      sizeBytes,
    };
  } catch (error) {
    if (timedOut) throw new RequestError("timeout");
    if (signal.aborted) throw new RequestError("cancelled");
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RequestError("timeout");
    }
    // fetch rejects with a TypeError for both network failures and CORS blocks.
    // There is no reliable way to tell them apart, so use connectivity as a hint.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new RequestError("network");
    }
    if (error instanceof TypeError) {
      throw new RequestError("cors");
    }
    throw new RequestError("unknown");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onExternalAbort);
  }
}
