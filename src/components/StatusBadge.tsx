import { cx } from "../lib/format";

interface StatusBadgeProps {
  status: number | null;
  statusText?: string;
  className?: string;
}

function toneFor(status: number | null): string {
  if (status === null) {
    return "bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30";
  }
  if (status >= 200 && status < 300) {
    return "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30";
  }
  if (status >= 300 && status < 400) {
    return "bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/30";
  }
  if (status >= 400 && status < 500) {
    return "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30";
  }
  return "bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30";
}

export function StatusBadge({ status, statusText, className }: StatusBadgeProps) {
  const label = status === null ? "Failed" : `${status}${statusText ? ` ${statusText}` : ""}`;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset tabular-nums",
        toneFor(status),
        className,
      )}
      aria-label={`HTTP status ${label}`}
    >
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          status === null
            ? "bg-rose-500"
            : status < 300
              ? "bg-emerald-500"
              : status < 400
                ? "bg-sky-500"
                : status < 500
                  ? "bg-amber-500"
                  : "bg-rose-500",
        )}
      />
      {label}
    </span>
  );
}
