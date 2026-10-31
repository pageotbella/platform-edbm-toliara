import { Check } from "lucide-react";
import type { OpportunityStatus } from "@/config/constants";
import { cn } from "@/lib/utils";
import { PORTEUR_STATUS } from "../status";

const STEPS = ["Brouillon", "Transmis", "Validé", "Publié"];
const STEP_OF: Record<OpportunityStatus, number> = { brouillon: 0, en_verification: 1, validee: 2, publiee: 3, suspendue: 3, archivee: 3 };

export function PorteurStatusBadge({ status, className }: { status: OpportunityStatus; className?: string }) {
  const s = PORTEUR_STATUS[status];
  return <span className={cn("label-caps inline-flex rounded px-2 py-1", s.tone, className)}>{s.label}</span>;
}

/** Frise des quatre étapes : faites, en cours, à venir. */
export function ProjectProgress({ status, className }: { status: OpportunityStatus; className?: string }) {
  const current = STEP_OF[status];
  const stopped = status === "suspendue" || status === "archivee";
  return (
    <ol className={cn("flex items-center", className)} aria-label={`Avancement : ${PORTEUR_STATUS[status].label}`}>
      {STEPS.map((label, i) => {
        const done = i < current || (i === current && status === "publiee");
        const active = i === current && !done;
        return (
          <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
            <span className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done && "border-emerald-600 bg-emerald-600 text-white",
                  active && !stopped && "border-primary bg-primary text-white",
                  active && stopped && "border-slate-400 bg-slate-400 text-white",
                  !done && !active && "border-border-strong bg-white text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("text-[11px] font-semibold whitespace-nowrap", done || active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className={cn("mx-1.5 mb-5 h-0.5 flex-1 rounded", i < current ? "bg-emerald-600" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
