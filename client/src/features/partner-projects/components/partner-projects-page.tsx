import { Handshake, Landmark, SearchX } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { PageBand } from "@/components/layouts/page-band";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePartnerProjects } from "../hooks";
import { projectPhase } from "../period";
import { PartnerProjectCard } from "./partner-project-card";

// Page publique : projets financés par les partenaires techniques et financiers, déjà en cours dans la région
export function PartnerProjectsPage() {
  const { data, isPending } = usePartnerProjects();
  const [donor, setDonor] = useState<string | null>(null);
  const projects = data ?? [];
  const donors = [...new Set(projects.map((p) => p.donor))].sort();
  const rows = donor ? projects.filter((p) => p.donor === donor) : projects;
  const total = projects.reduce((s, p) => s + (p.amountUsd ?? 0), 0);

  return (
    <>
      <title>Projets des partenaires — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "Projets des partenaires" }]}
        eyebrow="Partenaires techniques et financiers"
        title="Projets en cours dans la région"
        description="Programmes financés par les bailleurs (BAD, Banque mondiale, PNUD…) et suivis par l'antenne EDBM de Toliara : objectifs, financement, bénéficiaires et points focaux."
      >
        <div className="flex flex-wrap gap-6 rounded-lg border bg-surface-low px-5 py-3">
          <div><p className="label-caps text-muted-foreground">Projets</p><p className="tabular text-xl font-bold">{projects.length}</p></div>
          <div><p className="label-caps text-muted-foreground">En cours</p><p className="tabular text-xl font-bold">{projects.filter((p) => projectPhase(p) === "en_cours").length}</p></div>
          <div><p className="label-caps text-muted-foreground">Bailleurs</p><p className="tabular text-xl font-bold">{donors.length}</p></div>
          <div><p className="label-caps text-muted-foreground">Financements annoncés</p><p className="tabular text-xl font-bold">{formatAmount(total)}</p></div>
        </div>
      </PageBand>

      <div className="container-page space-y-5 py-10">
        {donors.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par bailleur">
            <span className="label-caps mr-1 flex items-center gap-1.5 text-muted-foreground"><Landmark className="size-3.5" /> Bailleur :</span>
            {[null, ...donors].map((d) => (
              <button
                key={d ?? "tous"}
                type="button"
                onClick={() => setDonor(d)}
                aria-pressed={donor === d}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition",
                  donor === d ? "border-primary bg-primary text-white" : "bg-white text-secondary hover:bg-muted",
                )}
              >
                {d ?? "Tous"}
              </button>
            ))}
          </div>
        )}

        {isPending ? (
          <div className="grid gap-5 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
        ) : rows.length ? (
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {rows.map((p) => <PartnerProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <EmptyState icon={SearchX} title="Aucun projet à afficher" description="Les projets des partenaires seront publiés ici par l'antenne EDBM." />
        )}

        <p className="flex items-start gap-2 rounded-lg border bg-white p-4 text-sm text-muted-foreground">
          <Handshake className="mt-0.5 size-4 shrink-0 text-primary" />
          Ces programmes sont déjà financés : ils ne font pas l&apos;objet de demandes d&apos;intérêt. Pour un partenariat ou une information, contactez l&apos;antenne EDBM de Toliara.
        </p>
      </div>
    </>
  );
}
