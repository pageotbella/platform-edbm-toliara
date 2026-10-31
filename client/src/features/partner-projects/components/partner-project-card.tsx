import { Building2, CalendarRange, ChevronDown, Coins, Landmark, MapPin, Tags, UserRound, Users } from "lucide-react";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PartnerProject } from "@/types";
import { PHASE, periodLabel, projectPhase } from "../period";

function Fact({ icon: Icon, label, children }: { icon: typeof Coins; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <dt className="label-caps text-[10px] text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm break-words">{children}</dd>
      </div>
    </div>
  );
}

// Fiche d'un projet financé par un PTF : en-tête, faits clés, détails dépliables
const isPlainAmount = (s: string) => /^[\d\s.,]+(usd)?$/i.test(s.trim());

export function PartnerProjectCard({ project: p, actions }: { project: PartnerProject; actions?: React.ReactNode }) {
  const phase = PHASE[projectPhase(p)];
  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p className="label-caps flex flex-wrap items-center gap-2 text-[10px] text-primary">
            <Landmark className="size-3.5" /> {p.donor}
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" /> {p.region}</span>
          </p>
          <h2 className="mt-1 text-xl font-bold text-primary-dark">{p.title}</h2>
          {p.fullName && <p className="text-sm text-muted-foreground">{p.fullName}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase", phase.className)}>{phase.label}</span>
          <span className="flex items-center gap-1 rounded-md border bg-surface-low px-2 py-1 font-mono text-[11px] text-secondary">
            <CalendarRange className="size-3.5" /> {periodLabel(p)}
          </span>
          {actions}
        </div>
      </header>

      <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <Fact icon={Coins} label="Financement">
          {p.amountUsd != null && <b className="tabular mr-1">{formatAmount(p.amountUsd)}</b>}
          {p.funding && !(p.amountUsd != null && isPlainAmount(p.funding)) && <span className={cn(p.amountUsd != null && "block text-xs text-muted-foreground")}>{p.funding}</span>}
          {p.amountUsd == null && !p.funding && <span className="text-muted-foreground">Non communiqué</span>}
        </Fact>
        <Fact icon={Building2} label="Mise en œuvre">{p.implementer ?? "—"}</Fact>
        <Fact icon={Tags} label="Secteurs">{p.sectors ?? "—"}</Fact>
        <Fact icon={CalendarRange} label="Durée">{p.duration ?? periodLabel(p)}</Fact>
      </dl>

      {(p.beneficiaries || p.notes || p.contact || p.source) && (
        <details className="group border-t">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-semibold text-primary hover:bg-surface-low/60 [&::-webkit-details-marker]:hidden">
            Bénéficiaires, résultats et point focal
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-4 bg-surface-low/40 px-5 py-4 text-sm">
            {p.beneficiaries && (
              <section>
                <h3 className="label-caps flex items-center gap-1.5 text-[10px] text-secondary"><Users className="size-3.5" /> Cibles et bénéficiaires</h3>
                <p className="mt-1 leading-6">{p.beneficiaries}</p>
              </section>
            )}
            {p.notes && (
              <section>
                <h3 className="label-caps text-[10px] text-secondary">Informations clés</h3>
                <p className="mt-1 leading-6 whitespace-pre-line">{p.notes}</p>
              </section>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {p.contact && (
                <p className="rounded-md border bg-white px-3 py-2">
                  <span className="label-caps flex items-center gap-1.5 text-[10px] text-muted-foreground"><UserRound className="size-3.5" /> Point focal</span>
                  <span className="mt-0.5 block">{p.contact}</span>
                </p>
              )}
              {p.source && (
                <p className="rounded-md border bg-white px-3 py-2">
                  <span className="label-caps block text-[10px] text-muted-foreground">Source</span>
                  <span className="mt-0.5 block">{p.source}</span>
                </p>
              )}
            </div>
          </div>
        </details>
      )}
    </article>
  );
}
