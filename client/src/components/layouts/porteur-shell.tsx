import { CircleHelp, FilePlus2, MapPin, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { useContact } from "@/features/settings/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { NAV, type NavItem } from "./nav-config";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

// Coquille de l'espace porteur, dans l'esprit des tableaux de bord d'exploitation :
// barre supérieure (recherche, action principale), onglets horizontaux, bandeau de contexte, pied sombre.

const ITEMS: NavItem[] = NAV.porteur.sections.flatMap((s) => s.items);

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Onglet actif : la fiche d'un projet reste sous « Mes projets », le dépôt sous « Déposer un projet ». */
function activeHref(pathname: string) {
  if (pathname.startsWith("/porteur/projets/") && pathname !== "/porteur/projets/nouveau") return "/porteur";
  return ITEMS.filter((i) => isActive(pathname, i)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function UnreadBadge() {
  const { data: session } = useSession();
  const { data } = useUnreadCount({ enabled: !!session });
  if (!data) return null;
  return <span className="rounded-full bg-destructive px-1.5 text-[10px] leading-4 font-bold text-white">{data > 9 ? "9+" : data}</span>;
}

// Recherche d'un dossier (référence, titre, localité) : filtre le registre de « Mes projets » par ?q=,
// le champ suit ce paramètre (lien partagé, recherche effacée depuis le registre)
function ProjectSearch() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const current = pathname === "/porteur" ? (params.get("q") ?? "") : "";
  return <ProjectSearchField key={current} initial={current} />;
}

function ProjectSearchField({ initial }: { initial: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      className="relative hidden w-72 md:block"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(q.trim() ? `/porteur?q=${encodeURIComponent(q.trim())}` : "/porteur");
      }}
    >
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="OPP-ATS-2026-…, titre, localité"
        aria-label="Rechercher un de mes projets"
        className="h-9 w-full rounded-md border bg-white pr-3 pl-9 font-mono text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      />
    </form>
  );
}

export function PorteurShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const contact = useContact();
  const current = activeHref(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-white">
        {/* Barre supérieure */}
        <div className="container-page flex h-16 items-center gap-3 lg:gap-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="EDBM Toliara — accueil">
            <img src="/logo-edbm-96.png" alt="" width={36} height={36} className="size-9" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-base font-bold text-primary-dark">EDBM Toliara</span>
              <span className="label-caps block text-[9px] text-muted-foreground">Espace porteur de projet</span>
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 xl:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" /> En ligne · Dépôt à distance ouvert
          </span>

          <div className="ml-auto flex items-center gap-2">
            <ProjectSearch />
            <span className="hidden h-9 items-center gap-1.5 rounded-md border bg-surface-low px-3 text-xs font-medium text-secondary lg:flex">
              <MapPin className="size-3.5 text-primary" /> Antenne Toliara
            </span>
            <Link to="/porteur/projets/nouveau" className={cn(buttonVariants(), "h-9 px-3")}>
              <FilePlus2 /> <span className="hidden sm:inline">Déposer un projet</span>
            </Link>
            <NotificationBell />
            <Link to="/contact" className="hidden size-9 items-center justify-center rounded-md text-secondary transition hover:bg-muted sm:flex" aria-label="Aide et contact">
              <CircleHelp className="size-5" />
            </Link>
            <UserMenu compact />
          </div>
        </div>

        {/* Onglets de l'espace */}
        <nav className="container-page flex gap-1 overflow-x-auto" aria-label={NAV.porteur.label}>
          {ITEMS.map((item) => {
            const active = item.href === current;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition",
                  active ? "border-primary text-primary" : "border-transparent text-secondary hover:border-border-strong hover:text-foreground",
                )}
              >
                <item.icon className="size-4" /> {item.label}
                {item.badge === "notifications" && <UnreadBadge />}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Bandeau de contexte : antenne et disponibilité */}
      <div className="border-b bg-white">
        <div className="container-page flex flex-wrap items-center gap-x-5 gap-y-1 py-2 font-mono text-[11px] text-secondary">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" /> Dépôt en ligne : 24 h/24</span>
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Instruction : {contact.hours}</span>
          <span className="hidden items-center gap-1.5 sm:flex"><RefreshCw className="size-3" /> Suivi par e-mail à chaque étape</span>
        </div>
      </div>

      <main className="container-page flex-1 py-6 md:py-8">{children}</main>

      <footer className="bg-primary-dark text-white">
        <div className="container-page flex flex-col gap-3 py-5 text-xs md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-white p-1">
              <img src="/logo-edbm-96.png" alt="" width={28} height={28} className="size-7" />
            </span>
            <span className="leading-tight">
              <b className="block text-sm">EDBM Toliara — Economic Development Board of Madagascar</b>
              <span className="text-white/70">Antenne régionale Atsimo-Andrefana · {contact.address}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/80">
            <span>Assistance : {contact.phone}</span>
            <a href={`mailto:${contact.email}`} className="hover:text-white hover:underline">{contact.email}</a>
            <span className="flex items-center gap-1.5 text-brand-light"><span className="size-1.5 rounded-full bg-emerald-400" /> Espace porteur</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
