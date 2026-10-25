import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pages(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pager({
  page, pageCount, total, pageSize, onPageChange, label = "résultats", className,
}: {
  page: number;
  pageCount: number;
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}) {
  const btn = "flex h-8 min-w-8 items-center justify-center rounded border bg-white px-2 text-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      {total !== undefined && pageSize ? (
        <p className="text-sm text-muted-foreground">
          {total === 0 ? `Aucun ${label}` : (
            <>Affichage de <b className="text-foreground">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</b> sur <b className="text-foreground">{total}</b> {label}</>
          )}
        </p>
      ) : <span />}
      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button type="button" className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente">
            <ChevronLeft className="size-4" />
          </button>
          {pages(page, pageCount).map((p, i) =>
            p === "…" ? <span key={`e${i}`} className="px-1 text-muted-foreground">…</span> : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(btn, p === page && "border-primary bg-primary text-white hover:bg-primary")}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={btn} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
