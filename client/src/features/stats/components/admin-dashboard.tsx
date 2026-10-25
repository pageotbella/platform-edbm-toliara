import {
  FolderKanban, History, KeyRound, MapPinned, Send, Settings, Shapes, ShieldCheck, UserPlus, Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel, PanelLink } from "@/components/common/panel";
import { HBarChart, MonthlyAreaChart } from "@/features/stats/components/charts";
import { buttonVariants } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/config/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAdminStats } from "@/features/stats/hooks";
import { actionLabel, detailSummary } from "@/features/audit-logs/audit-labels";

const QUICK = [
  { href: "/admin/utilisateurs?nouveau=1", label: "Créer un utilisateur", text: "Agent EDBM, administrateur ou investisseur", icon: UserPlus },
  { href: "/admin/roles", label: "Configurer les permissions", text: "Publication, secteurs, régions", icon: KeyRound },
  { href: "/admin/secteurs", label: "Gérer les secteurs", text: "Ajouter, modifier, désactiver", icon: Shapes },
  { href: "/admin/parametres", label: "Paramètres système", text: "Coordonnées de l'antenne", icon: Settings },
];

// Tableau de bord administrateur (section 21 ; maquette « tableau_de_bord_super_administrateur »)
export function AdminDashboard() {
  const { data: s } = useAdminStats();
  if (!s) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration" }, { label: "Tableau de bord" }]}
        eyebrow="Gouvernance de la plateforme"
        title="Console d'administration"
        description="Supervision des comptes, des rôles, des référentiels et de l'activité de la plateforme EDBM Toliara."
        actions={
          <>
            <Link to="/admin/utilisateurs?nouveau=1" className={cn(buttonVariants(), "h-10 px-4")}><UserPlus /> Nouvel utilisateur</Link>
            <Link to="/admin/journal" className={cn(buttonVariants({ variant: "outline" }), "h-10 bg-white px-4")}><History /> Journal</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Utilisateurs" value={s.users.total} icon={Users}
          hint={<span className="grid grid-cols-3 gap-2 text-center">
            <span><b className="block text-foreground">{s.users.investisseur}</b>investisseurs</span>
            <span><b className="block text-foreground">{s.users.agent}</b>agents</span>
            <span><b className="block text-foreground">{s.users.admin}</b>admins</span>
          </span>} />
        <KpiCard label="Opportunités" value={s.opportunities.total} icon={FolderKanban} accent="ochre" hint={`${s.opportunities.published} publiée(s)`} />
        <KpiCard label="Référentiels" value={s.sectors.active} unit="secteurs actifs" icon={MapPinned} accent="secondary"
          hint={`${s.regions.total} régions · ${s.regions.districts} districts · ${s.regions.communes} communes`} />
        <KpiCard label="Demandes d'intérêt" value={s.requests.total} icon={Send} hint={`${s.requests.open} en cours de traitement`} />
      </div>
      {s.users.inactive > 0 && (
        <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <ShieldCheck className="size-4" /> {s.users.inactive} compte(s) désactivé(s).
          <Link to="/admin/utilisateurs?statut=desactive" className="font-semibold underline">Voir</Link>
        </p>
      )}

      <Panel title="Actions rapides" bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK.map(({ href, label, text, icon: Icon }) => (
          <Link key={href} to={href} className="flex items-center gap-3 rounded-md border bg-surface-low/50 p-3 transition hover:border-border-strong hover:bg-surface-low">
            <span className="flex size-10 shrink-0 items-center justify-center rounded bg-primary text-white"><Icon className="size-5" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="block truncate text-xs text-muted-foreground">{text}</span></span>
          </Link>
        ))}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Nouveaux comptes" description="Inscriptions et créations de comptes par mois (12 derniers mois)">
          <MonthlyAreaChart data={s.signups} label="Comptes créés" />
        </Panel>
        <Panel title="Demandes d'intérêt par région">
          <HBarChart data={s.requestsByRegion} label="Demandes" />
        </Panel>
      </div>

      <Panel title="Activité récente" icon={History} action={<PanelLink href="/admin/journal">Journal complet →</PanelLink>} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-5 py-3">Date</th><th className="px-3 py-3">Utilisateur</th><th className="px-3 py-3">Rôle</th><th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {s.recent.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="tabular px-5 py-3 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</td>
                  <td className="px-3 py-3"><p className="font-medium">{a.userName ?? "Système"}</p><p className="text-xs text-muted-foreground">{a.userEmail}</p></td>
                  <td className="px-3 py-3"><span className="label-caps rounded bg-surface-low px-2 py-1 text-secondary">{a.userRole ? ROLE_LABELS[a.userRole as Role] : "—"}</span></td>
                  <td className="px-5 py-3"><p>{actionLabel(a.action)}</p>{detailSummary(a.action, a.details) && <p className="text-xs text-muted-foreground">{detailSummary(a.action, a.details)}</p>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
