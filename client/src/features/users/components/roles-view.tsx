import { useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Minus, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AgentPermissions } from "@/types";
import { useAgents, useSetPermissions } from "../hooks";
import { PERM_LABELS } from "@/config/constants";

type Cell = "oui" | "non" | "perm";
// Matrice des rôles (section 7 du cahier des charges)
const MATRIX: { feature: string; cells: [Cell, Cell, Cell, Cell, Cell] }[] = [
  { feature: "Consulter les opportunités", cells: ["oui", "oui", "oui", "oui", "oui"] },
  { feature: "Rechercher et utiliser les filtres", cells: ["oui", "oui", "oui", "oui", "oui"] },
  { feature: "Consulter la carte", cells: ["oui", "oui", "oui", "oui", "oui"] },
  { feature: "Créer un compte (investisseur ou porteur)", cells: ["oui", "non", "non", "non", "non"] },
  { feature: "Ajouter aux favoris", cells: ["non", "oui", "non", "non", "non"] },
  { feature: "Envoyer une demande d'intérêt", cells: ["non", "oui", "non", "non", "non"] },
  { feature: "Consulter ses demandes", cells: ["non", "oui", "non", "non", "non"] },
  { feature: "Déposer et suivre ses projets", cells: ["non", "non", "oui", "non", "non"] },
  { feature: "Créer / modifier une opportunité", cells: ["non", "non", "non", "oui", "oui"] },
  { feature: "Publier une opportunité", cells: ["non", "non", "non", "perm", "oui"] },
  { feature: "Gérer les secteurs", cells: ["non", "non", "non", "perm", "oui"] },
  { feature: "Gérer les régions", cells: ["non", "non", "non", "perm", "oui"] },
  { feature: "Traiter les demandes d'intérêt", cells: ["non", "non", "non", "oui", "oui"] },
  { feature: "Consulter les statistiques", cells: ["non", "non", "non", "oui", "oui"] },
  { feature: "Gérer les utilisateurs et les rôles", cells: ["non", "non", "non", "non", "oui"] },
  { feature: "Consulter le journal d'activité", cells: ["non", "non", "non", "non", "oui"] },
];
const ROLES_HEAD = ["Visiteur", "Investisseur", "Porteur de projet", "Agent EDBM", "Administrateur"];

function MatrixCell({ v }: { v: Cell }) {
  if (v === "oui") return <Check className="mx-auto size-4 text-emerald-600" aria-label="Autorisé" />;
  if (v === "non") return <Minus className="mx-auto size-4 text-slate-300" aria-label="Non autorisé" />;
  return <span className="label-caps rounded bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-800">Selon permission</span>;
}

type Perm = keyof typeof PERM_LABELS;

export function RolesView() {
  const qc = useQueryClient();
  const { data, isPending } = useAgents();
  const set = useSetPermissions({
    onMutate: async (v) => {
      // Mise à jour optimiste du tableau
      const key = ["users", "agents"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData<AgentPermissions[]>(key, (rows) => rows?.map((r) => (r.id === v.userId ? { ...r, ...v } : r)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      toast.error(e.message);
      const prev = (ctx as { prev?: AgentPermissions[] } | undefined)?.prev;
      if (prev) qc.setQueryData(["users", "agents"], prev);
    },
    onSuccess: () => toast.success("Permissions enregistrées"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration", href: "/admin" }, { label: "Rôles & permissions" }]}
        eyebrow="Sécurité & accès"
        title="Rôles et permissions"
        description="Les droits de chaque rôle suivent la matrice du cahier des charges. Les agents peuvent recevoir des permissions étendues individuelles."
      />

      <Panel title="Permissions des agents EDBM" icon={KeyRound} description="Modifications appliquées immédiatement et enregistrées dans le journal d'activité." bodyClassName="p-0">
        {isPending ? <Skeleton className="m-5 h-40" /> : !data?.length ? (
          <EmptyState className="m-5" icon={Users} title="Aucun agent" action={<Link to="/admin/utilisateurs?nouveau=1" className="text-sm font-semibold text-primary">Créer un agent</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-5 py-3">Agent</th>
                  {(Object.keys(PERM_LABELS) as Perm[]).map((k) => <th key={k} className="px-3 py-3 text-center">{PERM_LABELS[k]}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className={cn("border-b last:border-0", a.status !== "actif" && "opacity-60")}>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{a.name}{a.status !== "actif" && <span className="ml-2 text-xs text-red-700">(désactivé)</span>}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </td>
                    {(Object.keys(PERM_LABELS) as Perm[]).map((k) => (
                      <td key={k} className="px-3 py-3 text-center">
                        <Switch
                          checked={a[k]}
                          aria-label={`${PERM_LABELS[k]} — ${a.name}`}
                          onCheckedChange={(v) => set.mutate({ userId: a.id, canPublish: a.canPublish, canManageSectors: a.canManageSectors, canManageRegions: a.canManageRegions, [k]: v })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Matrice des rôles" icon={Shield} description="Section 7 du cahier des charges — appliquée côté serveur sur chaque action." bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="label-caps border-b bg-muted/50 text-muted-foreground">
                <th className="px-5 py-3 text-left">Fonctionnalité</th>
                {ROLES_HEAD.map((r) => <th key={r} className="px-3 py-3 text-center">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.feature} className="border-b last:border-0">
                  <td className="px-5 py-2.5">{row.feature}</td>
                  {row.cells.map((c, i) => <td key={i} className="px-3 py-2.5 text-center"><MatrixCell v={c} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
