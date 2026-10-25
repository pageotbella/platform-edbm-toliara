import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex flex-wrap items-center gap-1.5 text-xs text-slate-400", className)}>
      <Link to="/" className="hover:text-primary" aria-label="Accueil">
        <Home className="size-3.5" />
      </Link>
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="size-3" />
          {c.href && i < items.length - 1 ? (
            <Link to={c.href} className="hover:text-primary">{c.label}</Link>
          ) : (
            <span className="font-semibold text-primary">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title, description, eyebrow, crumbs, actions, className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-2">
          {eyebrow && <p className="label-caps text-ochre">{eyebrow}</p>}
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[28px] md:leading-9">{title}</h1>
          {description && <p className="text-[15px] leading-6 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow, title, description, action, className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl space-y-2">
        {eyebrow && <p className="label-caps text-muted-foreground">{eyebrow}</p>}
        <h2 className="text-[26px] font-bold leading-[34px] tracking-tight md:text-3xl">{title}</h2>
        {description && <p className="text-[15px] leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
