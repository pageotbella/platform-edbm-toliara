import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Bloc blanc à bordure fine des tableaux de bord (Level 1 du DESIGN.md)
export function Panel({
  title, description, action, icon: Icon, className, bodyClassName, children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              {Icon && <Icon className="size-4 text-primary" />} {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link to={href} className="rounded bg-surface-low px-2.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-accent">
      {children}
    </Link>
  );
}
