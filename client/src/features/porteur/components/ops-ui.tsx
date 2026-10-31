import { AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Éléments visuels de l'espace porteur, dans l'esprit des tableaux de bord d'exploitation :
// en-tête encadré, bandeau d'alerte, tuiles d'indicateurs, pastilles d'état, échelle de complétude.

/** En-tête de page encadré : fil d'ariane en capitales, grand titre, actions à droite. */
export function OpsHeader({ eyebrow, icon: Icon, title, description, actions, children }: {
  eyebrow: React.ReactNode;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-card md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="label-caps flex items-center gap-1.5 text-primary">
            {Icon && <Icon className="size-3.5" />} {eyebrow}
          </p>
          <h1 className="text-2xl leading-tight font-bold tracking-tight text-primary-dark md:text-[32px] md:leading-10">{title}</h1>
          {description && <div className="max-w-2xl text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

const ALERT_TONES = {
  danger: { box: "border-red-200 border-l-red-600 bg-red-50/70", icon: "border-red-200 text-red-600", title: "text-red-700" },
  warning: { box: "border-amber-200 border-l-amber-500 bg-amber-50/70", icon: "border-amber-200 text-amber-600", title: "text-amber-800" },
  info: { box: "border-primary/20 border-l-primary bg-accent/70", icon: "border-primary/20 text-primary", title: "text-primary-dark" },
} as const;

/** Bandeau d'alerte : bordure gauche colorée, icône encadrée, action à droite. */
export function AlertStrip({ tone = "warning", title, children, action, icon }: {
  tone?: keyof typeof ALERT_TONES;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  const t = ALERT_TONES[tone];
  const Icon = icon ?? (tone === "info" ? Info : AlertTriangle);
  return (
    <section className={cn("flex flex-col gap-3 rounded-lg border border-l-4 p-4 sm:flex-row sm:items-center", t.box)} role={tone === "info" ? "status" : "alert"}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border bg-white", t.icon)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", t.title)}>{title}</p>
        {children && <div className="mt-0.5 text-sm text-secondary">{children}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </section>
  );
}

const TILE_TONES = {
  primary: { icon: "bg-accent text-primary", edge: "" },
  blue: { icon: "bg-blue-50 text-blue-700", edge: "" },
  green: { icon: "bg-emerald-50 text-emerald-700", edge: "" },
  amber: { icon: "bg-amber-50 text-amber-600", edge: "border-l-4 border-l-amber-400" },
  red: { icon: "bg-red-50 text-red-600", edge: "border-l-4 border-l-red-500" },
} as const;

export type Segment = { label: string; value: number; className: string };

/** Tuile d'indicateur : libellé, icône teintée, grande valeur, barre de répartition légendée. */
export function StatTile({ label, value, icon: Icon, tone = "primary", sub, segments, valueClassName }: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof TILE_TONES;
  sub?: React.ReactNode;
  segments?: Segment[];
  valueClassName?: string;
}) {
  const t = TILE_TONES[tone];
  const total = segments?.reduce((s, x) => s + x.value, 0) ?? 0;
  return (
    <div className={cn("flex flex-col rounded-lg border bg-white p-4 shadow-card", t.edge)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-secondary">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", t.icon)}><Icon className="size-4.5" /></span>
      </div>
      <p className={cn("tabular mt-2 text-[28px] leading-none font-bold tracking-tight text-primary-dark", valueClassName)}>{value}</p>
      {sub && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
      {segments && (
        <div className="mt-auto pt-3">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
            {total > 0 && segments.map((s) => <span key={s.label} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />)}
          </div>
          <div className="mt-1.5 flex justify-between gap-2 text-[11px] text-muted-foreground">
            {segments.map((s) => <span key={s.label}>{s.label} : <b className="tabular text-foreground">{s.value}</b></span>)}
          </div>
        </div>
      )}
    </div>
  );
}

/** Pastille d'état arrondie, bordée, en petites capitales. */
export function Pill({ className, icon: Icon, children }: { className: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase", className)}>
      {Icon && <Icon className="size-3" />} {children}
    </span>
  );
}

type Grade = "A" | "B" | "C" | "D" | "E" | "F";
const GRADE_TONE: Record<Grade, string> = {
  A: "border-emerald-300 bg-emerald-100 text-emerald-800",
  B: "border-emerald-300 bg-emerald-50 text-emerald-700",
  C: "border-amber-300 bg-amber-100 text-amber-800",
  D: "border-amber-300 bg-amber-50 text-amber-700",
  E: "border-red-300 bg-red-50 text-red-700",
  F: "border-red-300 bg-red-100 text-red-700",
};

/** Échelle hachurée de F à A, le curseur indique la note (complétude d'un dossier). */
export function GradeScale({ grade, ratio, label }: { grade: Grade; ratio: number; label?: string }) {
  return (
    <div>
      {label && <p className="mb-1.5 text-[13px] font-medium text-secondary">{label}</p>}
      <div
        className="relative flex h-7 items-center justify-between rounded-md border bg-muted/60 px-2 text-xs font-semibold text-muted-foreground [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgb(0_0_0/0.035)_6px_12px)]"
        role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label={`${label ?? "Note"} : ${grade}`}
      >
        <span>F</span>
        <span
          className={cn("absolute top-1/2 flex h-6 min-w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border px-1.5 text-xs font-bold", GRADE_TONE[grade])}
          style={{ left: `clamp(14px, ${ratio * 100}%, calc(100% - 14px))` }}
        >
          {grade}
        </span>
        <span>A</span>
      </div>
    </div>
  );
}

/** Référence de dossier en chasse fixe (OPP-ATS-2026-019). */
export function MonoRef({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[13px] font-semibold tracking-tight text-primary", className)}>{children}</span>;
}
