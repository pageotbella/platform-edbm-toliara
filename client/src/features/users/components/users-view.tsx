import { useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  KeyRound, Mail, MoreHorizontal, Pencil, Power, Search, ShieldCheck, ShieldOff, UserPlus, Users, Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pager } from "@/components/common/pager";
import { SimpleSelect } from "@/components/common/simple-select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth-client";
import { ROLE_LABELS, ROLES, type Role, PERM_LABELS } from "@/config/constants";
import { formatDate, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCreateUser, useResendInvite, useResetPassword, useSetUserStatus, useUpdateUser, useUsers } from "@/features/users/hooks";

const PAGE_SIZE = 12;
type Perms = { canPublish: boolean; canManageSectors: boolean; canManageRegions: boolean };
const NO_PERMS: Perms = { canPublish: false, canManageSectors: false, canManageRegions: false };
const ROLE_TONE: Record<Role, string> = {
  investisseur: "bg-emerald-50 text-emerald-800",
  porteur: "bg-accent text-primary",
  agent: "bg-blue-50 text-blue-800",
  admin: "bg-amber-50 text-amber-800",
};

/** Mot de passe temporaire aléatoire (lettres, chiffres, symbole). */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `${Array.from(bytes, (b) => chars[b % chars.length]).join("")}!7`;
}

type Editing = {
  id?: string; name: string; email: string; phone: string; role: Role; permissions: Perms;
} | null;

function PermissionSwitches({ value, onChange }: { value: Perms; onChange: (p: Perms) => void }) {
  return (
    <div className="space-y-2 rounded-md border bg-surface-low/50 p-3">
      <p className="text-[13px] font-semibold text-secondary">Permissions de l&apos;agent (« selon permission »)</p>
      {(Object.keys(PERM_LABELS) as (keyof Perms)[]).map((k) => (
        <label key={k} className="flex items-center justify-between gap-3 text-sm">
          {PERM_LABELS[k]}
          <Switch checked={value[k]} onCheckedChange={(v) => onChange({ ...value, [k]: v })} />
        </label>
      ))}
    </div>
  );
}

// Gestion des utilisateurs (section 22 ; maquette « gestion_des_utilisateurs_roles_permissions »)
export function UsersView({ initialCreate = false, initialStatus }: { initialCreate?: boolean; initialStatus?: "actif" | "desactive" }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const [role, setRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<"actif" | "desactive" | null>(initialStatus ?? null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing>(
    initialCreate ? { name: "", email: "", phone: "", role: "agent", permissions: NO_PERMS } : null,
  );
  const [resetFor, setResetFor] = useState<{ id: string; name: string; password: string } | null>(null);
  const [toggleFor, setToggleFor] = useState<{ id: string; name: string; status: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isPending } = useUsers({ q: search || undefined, role: role ?? undefined, status: status ?? undefined, page, pageSize: PAGE_SIZE }, { placeholderData: keepPreviousData });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["users"] }), qc.invalidateQueries({ queryKey: ["users"] }), qc.invalidateQueries({ queryKey: ["stats", "admin"] })]);
  const onError = (e: { message: string }) => toast.error(e.message);
  const create = useCreateUser({
    onSuccess: (d, v) => {
      if (d.emailSent) toast.success(`Compte créé — lien d'accès envoyé à ${v.email}`);
      else toast.warning("Compte créé, mais l'e-mail n'a pas pu être envoyé : utilisez « Renvoyer le lien d'accès »");
      setEditing(null); refresh();
    },
    onError,
  });
  const resendInvite = useResendInvite({ onSuccess: () => toast.success("Lien d'accès envoyé par e-mail"), onError });
  const update = useUpdateUser({ onSuccess: () => { toast.success("Compte mis à jour"); setEditing(null); refresh(); }, onError });
  const setUserStatus = useSetUserStatus({
    onSuccess: (_d, v) => { toast.success(v.status === "actif" ? "Compte réactivé" : "Compte désactivé — sessions fermées"); refresh(); }, onError,
  });
  const resetPassword = useResetPassword({
    onSuccess: () => { toast.success("Mot de passe réinitialisé — communiquez-le à l'utilisateur"); setResetFor(null); }, onError,
  });

  const c = data?.counts;
  const tabs: { label: string; role: Role | null; status: "desactive" | null; n?: number }[] = [
    { label: "Tous les comptes", role: null, status: null, n: c?.all },
    { label: "Investisseurs", role: "investisseur", status: null, n: c?.investisseur },
    { label: "Porteurs de projet", role: "porteur", status: null, n: c?.porteur },
    { label: "Agents EDBM", role: "agent", status: null, n: c?.agent },
    { label: "Administrateurs", role: "admin", status: null, n: c?.admin },
    { label: "Désactivés", role: null, status: "desactive", n: c?.desactive },
  ];
  const submit = () => {
    if (!editing) return;
    const permissions = editing.role === "agent" ? editing.permissions : undefined;
    if (editing.id) update.mutate({ id: editing.id, name: editing.name, phone: editing.phone || undefined, role: editing.role, permissions });
    else create.mutate({ name: editing.name, email: editing.email, phone: editing.phone || undefined, role: editing.role, permissions });
  };
  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration", href: "/admin" }, { label: "Utilisateurs" }]}
        eyebrow="Sécurité & accès"
        title="Gestion des utilisateurs"
        description="Créer, modifier, désactiver ou réactiver les comptes et attribuer les rôles. Les mots de passe sont stockés hachés, jamais en clair."
        actions={
          <Button className="h-10 px-4" onClick={() => setEditing({ name: "", email: "", phone: "", role: "agent", permissions: NO_PERMS })}>
            <UserPlus /> Nouvel utilisateur
          </Button>
        }
      />

      <div className="rounded-lg border bg-card shadow-card">
        <div className="flex gap-1 overflow-x-auto border-b px-3 py-2">
          {tabs.map((t) => {
            const active = role === t.role && (status === "desactive") === (t.status === "desactive");
            return (
              <button key={t.label} type="button" onClick={() => { setRole(t.role); setStatus(t.status); setPage(1); }}
                className={cn("flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold transition", active ? "bg-primary text-white" : "text-secondary hover:bg-muted", t.status && !active && "text-red-700")}>
                {t.label}
                <span className={cn("rounded px-1.5 text-[10px]", active ? "bg-white/20" : "bg-surface-low")}>{t.n ?? "…"}</span>
              </button>
            );
          })}
        </div>
        <div className="border-b p-3">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, entreprise…" className="h-10 pl-9" aria-label="Rechercher un utilisateur" />
          </div>
        </div>

        {isPending ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !data?.items.length ? (
          <EmptyState className="m-4" icon={Users} title="Aucun utilisateur" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3">Identité & contact</th>
                  <th className="px-3 py-3">Rôle</th>
                  <th className="px-3 py-3">Organisation</th>
                  <th className="px-3 py-3">Activité</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => {
                  const self = u.id === session?.user.id;
                  const r = u.role as Role;
                  return (
                    <tr key={u.id} className={cn("border-b last:border-0 hover:bg-muted/40", u.status !== "actif" && "bg-red-50/40")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", u.status === "actif" ? "bg-primary" : "bg-slate-400")}>{initials(u.name)}</span>
                          <div className="min-w-0">
                            <p className="font-semibold">{u.name}{self && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(vous)</span>}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("label-caps rounded px-2 py-1", ROLE_TONE[r])}>{ROLE_LABELS[r]}</span>
                        {r === "agent" && (
                          <p className="mt-1.5 flex flex-wrap gap-1">
                            {(Object.keys(PERM_LABELS) as (keyof Perms)[]).filter((k) => u[k]).map((k) => (
                              <span key={k} className="rounded bg-surface-low px-1.5 text-[10px] text-secondary">{PERM_LABELS[k]}</span>
                            ))}
                            {!u.canPublish && !u.canManageSectors && !u.canManageRegions && <span className="text-[10px] text-muted-foreground">Aucune permission étendue</span>}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">{r === "investisseur" || r === "porteur" ? (<><p className="font-medium">{u.company ?? "—"}</p><p className="text-muted-foreground">{u.country ?? ""}</p></>) : <span className="text-muted-foreground">EDBM Toliara</span>}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        <p>Créé le {formatDate(u.createdAt)}</p>
                        <p>{u.lastActive ? `Actif ${timeAgo(u.lastActive)}` : "Jamais connecté"}</p>
                        <p>{r === "investisseur" ? `${u.requests} demande(s)` : r === "porteur" ? `${u.opportunities} projet(s) déposé(s)` : `${u.opportunities} opportunité(s)`}</p>
                      </td>
                      <td className="px-3 py-3">
                        {u.status === "actif"
                          ? <span className="label-caps inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-emerald-800"><ShieldCheck className="size-3" /> Actif</span>
                          : <span className="label-caps inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-800"><ShieldOff className="size-3" /> Désactivé</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded hover:bg-muted" aria-label={`Actions pour ${u.name}`}>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setEditing({
                              id: u.id, name: u.name, email: u.email, phone: u.phone ?? "", role: r,
                              permissions: { canPublish: !!u.canPublish, canManageSectors: !!u.canManageSectors, canManageRegions: !!u.canManageRegions },
                            })}><Pencil /> Modifier / attribuer un rôle</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetFor({ id: u.id, name: u.name, password: generatePassword() })}><KeyRound /> Réinitialiser le mot de passe</DropdownMenuItem>
                            <DropdownMenuItem disabled={resendInvite.isPending} onClick={() => resendInvite.mutate(u.id)}><Mail /> Renvoyer le lien d&apos;accès</DropdownMenuItem>
                            {!self && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant={u.status === "actif" ? "destructive" : "default"} onClick={() => setToggleFor({ id: u.id, name: u.name, status: u.status })}>
                                  <Power /> {u.status === "actif" ? "Désactiver le compte" : "Réactiver le compte"}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager className="border-t p-3" page={page} pageCount={data.pageCount} total={data.total} pageSize={PAGE_SIZE} label="comptes" onPageChange={setPage} />}
      </div>

      {/* Création / modification */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier le compte" : "Nouvel utilisateur"}</DialogTitle>
            {!editing?.id && <DialogDescription>L&apos;utilisateur recevra par e-mail un lien pour définir lui-même son mot de passe (valable 72 heures).</DialogDescription>}
          </DialogHeader>
          {editing && (
            <form id="user-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <FormField label="Nom complet" htmlFor="u-name" required>
                <Input id="u-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
              </FormField>
              <FormField label="Adresse e-mail" htmlFor="u-email" required hint={editing.id ? "L'adresse de connexion ne peut pas être modifiée." : undefined}>
                <Input id="u-email" type="email" value={editing.email} disabled={!!editing.id} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </FormField>
              <FormField label="Téléphone" htmlFor="u-phone">
                <Input id="u-phone" type="tel" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </FormField>
              <FormField label="Rôle" required hint={editing.id === session?.user.id ? "Vous ne pouvez pas modifier votre propre rôle." : undefined}>
                <SimpleSelect value={editing.role} disabled={editing.id === session?.user.id}
                  onChange={(v) => v && setEditing({ ...editing, role: v as Role })}
                  options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
              </FormField>
              {editing.role === "agent" && <PermissionSwitches value={editing.permissions} onChange={(p) => setEditing({ ...editing, permissions: p })} />}
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button type="submit" form="user-form" disabled={saving}>{saving ? "Enregistrement…" : editing?.id ? "Enregistrer" : "Créer le compte"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Réinitialisation du mot de passe */}
      <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>Compte de {resetFor?.name}. Toutes ses sessions seront fermées.</DialogDescription>
          </DialogHeader>
          {resetFor && (
            <div className="flex gap-2">
              <Input value={resetFor.password} onChange={(e) => setResetFor({ ...resetFor, password: e.target.value })} className="font-mono" aria-label="Nouveau mot de passe" />
              <Button type="button" variant="outline" className="h-10" onClick={() => setResetFor({ ...resetFor, password: generatePassword() })} title="Générer"><Wand2 /></Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetFor(null)}>Annuler</Button>
            <Button disabled={resetPassword.isPending || (resetFor?.password.length ?? 0) < 8}
              onClick={() => resetFor && resetPassword.mutate({ id: resetFor.id, password: resetFor.password })}>
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toggleFor} onOpenChange={(o) => !o && setToggleFor(null)}
        destructive={toggleFor?.status === "actif"}
        title={toggleFor?.status === "actif" ? `Désactiver le compte de ${toggleFor?.name} ?` : `Réactiver le compte de ${toggleFor?.name} ?`}
        description={toggleFor?.status === "actif"
          ? "L'utilisateur sera déconnecté et ne pourra plus se connecter. Ses données sont conservées."
          : "L'utilisateur pourra de nouveau se connecter."}
        confirmLabel={toggleFor?.status === "actif" ? "Désactiver" : "Réactiver"}
        onConfirm={() => toggleFor && setUserStatus.mutate({ id: toggleFor.id, status: toggleFor.status === "actif" ? "desactive" : "actif" })}
      />
    </div>
  );
}
