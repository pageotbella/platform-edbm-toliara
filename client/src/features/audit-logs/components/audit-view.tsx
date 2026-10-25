import { keepPreviousData } from "@tanstack/react-query";
import { Code2, Download, History, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pager } from "@/components/common/pager";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, type Role } from "@/config/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { auditLogsApi } from "../api";
import { useAuditLogs } from "../hooks";
import { actionLabel, detailSummary, ENTITY_LABELS } from "../audit-labels";

const PAGE_SIZE = 25;
const tone = (action: string) =>
  /delete|deactivate/.test(action) ? "bg-red-50 text-red-800"
    : /role|permission|password|settings/.test(action) ? "bg-amber-50 text-amber-800"
      : /create|upload/.test(action) ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Journal d'activité (historique des actions importantes, sections 5.1 et 33)
export function AuditView() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const filters = {
    q: search || undefined, entity: entity ?? undefined, userId: userId ?? undefined,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  };
  const { data, isPending } = useAuditLogs({ ...filters, page, pageSize: PAGE_SIZE }, { placeholderData: keepPreviousData });
  const current = data?.items.find((i) => i.id === selected) ?? data?.items[0];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await auditLogsApi.export(filters);
      const lines = [
        ["Date", "Utilisateur", "E-mail", "Rôle", "Action", "Entité", "Identifiant", "Détails"].map(csvCell).join(";"),
        ...rows.map((r) => [formatDateTime(r.createdAt), r.userName, r.userEmail, r.userRole, actionLabel(r.action), ENTITY_LABELS[r.entity] ?? r.entity, r.entityId, JSON.stringify(r.details ?? {})].map(csvCell).join(";")),
      ];
      const url = URL.createObjectURL(new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `journal-edbm-${new Date().toISOString().slice(0, 10)}.csv` });
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} événement(s) exporté(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const reset = () => { setQ(""); setEntity(null); setUserId(null); setFrom(""); setTo(""); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration", href: "/admin" }, { label: "Journal d'activité" }]}
        eyebrow="Traçabilité"
        title="Journal d'activité"
        description="Historique des actions importantes : créations, modifications, publications, changements de rôle, téléversements…"
        actions={<Button variant="outline" className="h-10 bg-white px-4" disabled={exporting} onClick={exportCsv}><Download /> {exporting ? "Export…" : "Exporter (CSV)"}</Button>}
      />

      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-card md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, utilisateur, identifiant, détail…" className="h-10 pl-9" />
        </div>
        <SimpleSelect value={entity} onChange={(v) => { setEntity(v); setPage(1); }} allLabel="Tous les types d'entité"
          options={(data?.entities ?? []).map((e) => ({ value: e, label: ENTITY_LABELS[e] ?? e }))} />
        <SimpleSelect value={userId} onChange={(v) => { setUserId(v); setPage(1); }} allLabel="Tous les utilisateurs"
          options={(data?.actors ?? []).map((a) => ({ value: a.id, label: a.name }))} />
        <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-10" aria-label="Depuis le" />
        <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-10" aria-label="Jusqu'au" />
        <Button variant="ghost" className="h-10" onClick={reset}><RotateCcw /> Réinitialiser</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="rounded-lg border bg-card shadow-card">
          {isPending ? (
            <div className="space-y-2 p-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !data?.items.length ? (
            <EmptyState className="m-4" icon={History} title="Aucun événement" description="Aucun événement ne correspond aux filtres." />
          ) : (
            <ul>
              {data.items.map((a) => {
                const summary = detailSummary(a.action, a.details);
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => setSelected(a.id)}
                      className={cn("flex w-full flex-col gap-1 border-b px-5 py-3 text-left transition last:border-0 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4", current?.id === a.id && "bg-primary/5")}>
                      <span className="tabular w-36 shrink-0 text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                      <span className={cn("label-caps w-fit shrink-0 rounded px-2 py-1 text-[9px]", tone(a.action))}>{ENTITY_LABELS[a.entity] ?? a.entity}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{actionLabel(a.action)}{summary && <span className="font-normal text-muted-foreground"> · {summary}</span>}</span>
                        <span className="block truncate text-xs text-muted-foreground">{a.userName ?? "Système"}{a.userRole ? ` — ${ROLE_LABELS[a.userRole as Role]}` : ""}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {data && <Pager className="border-t p-3" page={page} pageCount={data.pageCount} total={data.total} pageSize={PAGE_SIZE} label="événements" onPageChange={setPage} />}
        </div>

        <aside className="h-fit overflow-hidden rounded-lg border bg-secondary text-white shadow-card xl:sticky xl:top-24">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <Code2 className="size-4 text-brand-light" />
            <p className="font-semibold">Détail de l&apos;événement</p>
          </div>
          {current ? (
            <div className="space-y-3 p-5 text-sm">
              <p className="label-caps text-brand-light">{current.action}</p>
              <dl className="space-y-1.5 text-white/85">
                <div className="flex justify-between gap-3"><dt className="text-white/60">Date</dt><dd>{formatDateTime(current.createdAt)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-white/60">Opérateur</dt><dd className="truncate">{current.userEmail ?? "Système"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-white/60">Entité</dt><dd>{ENTITY_LABELS[current.entity] ?? current.entity}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-white/60">Identifiant</dt><dd className="truncate font-mono text-xs">{current.entityId ?? "—"}</dd></div>
              </dl>
              <pre className="max-h-80 overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs leading-5 text-white/85">{JSON.stringify(current.details ?? {}, null, 2)}</pre>
            </div>
          ) : <p className="p-5 text-sm text-white/70">Sélectionnez un événement.</p>}
        </aside>
      </div>
    </div>
  );
}
