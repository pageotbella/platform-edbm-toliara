import { Headset, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { ROLE_HOME, ROLE_LABELS, type Role } from "@/config/constants";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isStaffSpace, NAV, type NavItem, type Space } from "./nav-config";
import { NotificationBell } from "./notification-bell";
import { useSignOut } from "@/features/auth/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useStaffMe } from "@/features/users/hooks";

function matches(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** L'entrée active est la correspondance la plus précise (ex. « Nouvelle opportunité » plutôt que « Opportunités »). */
function activeHref(pathname: string | null, items: NavItem[]) {
  if (!pathname) return null;
  return items.filter((i) => matches(pathname, i)).sort((x, y) => y.href.length - x.href.length)[0]?.href ?? null;
}

function useStaffInfo(space: Space) {
  return useStaffMe({ enabled: isStaffSpace(space) }).data;
}

function CountBadge({ n }: { n: number | undefined }) {
  if (!n) return null;
  return <span className="ml-auto rounded-full bg-ochre px-1.5 text-[10px] leading-4 font-bold text-white">{n > 9 ? "9+" : n}</span>;
}

function NotificationBadge() {
  const { data: session } = useSession();
  const { data } = useUnreadCount({ enabled: !!session });
  return <CountBadge n={data} />;
}

function NavLinks({ space, pathname = null, onNavigate }: { space: Space; pathname?: string | null; onNavigate?: () => void }) {
  const staff = useStaffInfo(space);
  // Entrées « selon permission » masquées tant que la permission n'est pas confirmée
  const sections = NAV[space].sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.perm || staff?.[i.perm]) }))
    .filter((s) => s.items.length);
  const current = activeHref(pathname, sections.flatMap((s) => s.items));
  return sections.map((section, i) => (
    <div key={i} className="space-y-1">
      {section.title && <p className="label-caps px-3 pt-4 pb-1 text-[10px] text-muted-foreground">{section.title}</p>}
      {section.items.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-muted hover:text-foreground",
              active && "bg-primary text-white hover:bg-primary hover:text-white",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge === "notifications" && <NotificationBadge />}
            {item.badge === "requests" && <CountBadge n={staff?.newRequests} />}
          </Link>
        );
      })}
    </div>
  ));
}

function Sidebar({ space, onNavigate }: { space: Space; onNavigate?: () => void }) {
  const logout = useSignOut();
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Logo />
      <div className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2">
        <span className="label-caps text-[10px] text-secondary">{NAV[space].label}</span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
          <span className="size-1.5 rounded-full bg-primary" /> En ligne
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto" aria-label={NAV[space].label}>
        <NavLinks space={space} onNavigate={onNavigate} pathname={pathname} />
      </nav>
      <div className="space-y-3">
        <div className="rounded-md bg-surface-low p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-secondary">
            <Headset className="size-4 text-primary" /> Assistance EDBM Toliara
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Un conseiller de l&apos;antenne régionale répond à vos questions.</p>
          <Link to="/contact" className="mt-1 block text-[11px] font-semibold text-primary hover:underline">Nous contacter →</Link>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="size-4" /> Déconnexion
        </button>
      </div>
    </div>
  );
}

function TopUser() {
  const { data: session, isPending } = useSession();
  if (isPending) return <Skeleton className="h-9 w-40" />;
  if (!session) return null;
  return (
    <Link to={`${ROLE_HOME[session.user.role as Role]}/profil`} className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted">
      <span className="hidden text-right leading-tight sm:block">
        <span className="block max-w-44 truncate text-sm font-semibold">{session.user.name}</span>
        <span className="label-caps mt-0.5 inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[9px] text-primary">
          <span className="size-1.5 rounded-full bg-primary" /> {ROLE_LABELS[session.user.role as Role]}
        </span>
      </span>
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {initials(session.user.name)}
      </span>
    </Link>
  );
}

// Coquille des espaces connectés (maquettes « tableau de bord ») : barre latérale + barre supérieure
export function AppShell({ space, children }: { space: Space; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">
        <Sidebar space={space} />
      </aside>
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="flex size-9 items-center justify-center rounded border lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Sidebar space={space} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="leading-tight">
              <p className="label-caps text-[10px] text-muted-foreground">République de Madagascar</p>
              <p className="text-sm font-semibold text-secondary md:text-[15px]">Portail régional d&apos;attractivité des investissements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="h-8 w-px bg-border" />
            <TopUser />
          </div>
        </div>
      </header>
      <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      <footer className="border-t bg-surface-low px-4 py-5 text-xs text-muted-foreground md:px-8">
        <div className="flex flex-col gap-1 md:flex-row md:justify-between">
          <p><b className="text-secondary">EDBM Toliara</b> · Antenne régionale Atsimo-Andrefana</p>
          <p>Economic Development Board of Madagascar — plateforme de valorisation des investissements</p>
        </div>
      </footer>
    </div>
  );
}
