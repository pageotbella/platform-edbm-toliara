import { Breadcrumbs, type Crumb } from "@/components/common/page-header";
import { cn } from "@/lib/utils";

// Bandeau d'en-tête des pages publiques intérieures
export function PageBand({
  title, description, eyebrow, crumbs, children, className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b bg-white", className)}>
      <div className="container-page space-y-4 py-8 md:py-10">
        <Breadcrumbs items={crumbs} />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-2">
            {eyebrow && <p className="label-caps text-ochre">{eyebrow}</p>}
            <h1 className="text-[26px] leading-[34px] font-bold tracking-tight md:text-4xl md:leading-[44px]">{title}</h1>
            {description && <p className="text-[15px] leading-6 text-muted-foreground md:text-base">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
