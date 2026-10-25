import { Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useContact } from "@/features/settings/hooks";
import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

const PUBLIC_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/opportunites", label: "Opportunités" },
  { href: "/carte", label: "Carte interactive" },
  { href: "/secteurs", label: "Secteurs" },
  { href: "/regions", label: "Régions" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

type NavProps = { mobile?: boolean; onNavigate?: () => void; pathname?: string | null };

function NavItems({ mobile, onNavigate, pathname = null }: NavProps) {
  return PUBLIC_NAV.map((item) => (
    <Link
      key={item.href}
      to={item.href}
      onClick={onNavigate}
      className={cn(
        mobile
          ? "rounded px-3 py-2.5 text-sm font-medium hover:bg-muted"
          : "rounded px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-muted hover:text-foreground",
        isActive(pathname, item.href) && (mobile ? "bg-surface-low text-primary" : "bg-surface-low font-semibold text-primary"),
      )}
    >
      {item.label}
    </Link>
  ));
}

function Nav(props: NavProps) {
  const { pathname } = useLocation();
  return <NavItems {...props} pathname={pathname} />;
}

export function SiteHeader() {
  const { phone } = useContact();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-gradient text-white">
        <div className="container-page flex h-8 items-center justify-between gap-4 text-[11px] font-medium">
          <p className="flex items-center gap-2 truncate">
            <span className="size-1.5 rounded-full bg-brand-light" aria-hidden />
            République de Madagascar · Région Atsimo-Andrefana
            <span className="hidden text-white/60 sm:inline">|</span>
            <span className="hidden text-brand-light sm:inline">Antenne régionale EDBM Toliara</span>
          </p>
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="hidden items-center gap-1.5 hover:underline md:flex">
            <Phone className="size-3" /> Guichet unique : {phone}
          </a>
        </div>
      </div>
      <div className="border-b bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
            <Nav />
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden sm:block"><UserMenu /></div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="flex size-9 items-center justify-center rounded border xl:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
                <nav className="flex flex-col gap-1 px-4" aria-label="Navigation mobile">
                  <Nav mobile onNavigate={() => setOpen(false)} />
                </nav>
                <div className="mt-4 border-t px-4 pt-4 sm:hidden"><UserMenu compact /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
