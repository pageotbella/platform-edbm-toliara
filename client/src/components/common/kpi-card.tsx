import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// « KPI Stat Card » du DESIGN.md : libellé en capitales, valeur tabulaire, note en dessous
export function KpiCard({
  label, value, unit, hint, icon: Icon, accent = "primary", className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  accent?: "primary" | "secondary" | "ochre" | "destructive";
  className?: string;
}) {
  const bar = {
    primary: "before:bg-primary",
    secondary: "before:bg-secondary",
    ochre: "before:bg-ochre",
    destructive: "before:bg-destructive",
  }[accent];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-5 shadow-card before:absolute before:inset-x-0 before:top-0 before:h-[3px]",
        bar,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded bg-surface-low text-secondary">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="tabular mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
      </p>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
