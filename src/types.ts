export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const HTTP_METHODS: readonly HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

export function methodHasBody(method: HttpMethod): boolean {
  return method !== "GET";
}

export type Theme = "light" | "dark";

export type ResponseTab = "body" | "headers";

export type RequestStatus = "idle" | "loading" | "success" | "error";

export type ErrorKind =
  | "invalid-url"
  | "invalid-header"
  | "network"
  | "cors"
  | "timeout"
  | "cancelled"
  | "unknown";

export interface RequestHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ResponseHeader {
  key: string;
  value: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  ok: boolean;
  headers: ResponseHeader[];
  body: string;
  contentType: string | null;
  isJson: boolean;
  json: unknown | null;
  durationMs: number;
  sizeBytes: number;
}

export interface PlaygroundError {
  kind: ErrorKind;
  message: string;
}

export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  body?: string;
  status: number | null;
  statusText: string;
  ok: boolean;
  durationMs: number;
  sizeBytes: number;
  timestamp: number;
}

export const HISTORY_LIMIT = 20;

export const ERROR_MESSAGES: Record<ErrorKind, string> = {
  "invalid-url": "Please enter a valid URL starting with http:// or https://",
  "invalid-header": "One of the header names or values is not valid.",
  network: "Could not reach the server. Check your connection.",
  cors: "This API blocks requests from browsers (CORS). Try an API that allows it.",
  timeout: "The request took too long and was stopped.",
  cancelled: "The request was cancelled.",
  unknown: "Something went wrong while sending the request.",
};
