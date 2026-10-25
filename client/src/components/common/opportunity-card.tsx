import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import type { OpportunityCardData } from "@/types";
import { OpportunityCover } from "./opportunity-cover";
import { StatusBadge } from "./status-badge";

type CardProps = {
  o: OpportunityCardData;
  layout?: "grid" | "list";
  showFavorite?: boolean;
  className?: string;
};

// « Opportunity Card » du DESIGN.md (section 12.2 du cahier des charges)
export function OpportunityCard({ o, layout = "grid", showFavorite = true, className }: CardProps) {
  const location = [o.district, o.region].filter(Boolean).join(", ");
  const accent = o.isFeatured ? "before:bg-ochre" : "before:bg-primary";

  if (layout === "list") {
    return (
      <article
        className={cn(
          "group relative flex flex-col gap-5 overflow-hidden rounded-lg border bg-card p-4 shadow-card transition hover:border-border-strong hover:shadow-hover sm:flex-row",
          "before:absolute before:inset-x-0 before:top-0 before:h-[3px]", accent, className,
        )}
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md sm:w-52">
          <OpportunityCover coverKey={o.coverKey} sectorSlug={o.sectorSlug} title={o.title} />
          <span className="label-caps absolute top-2 left-2 rounded bg-white/95 px-2 py-1 text-primary">{o.sector}</span>
          {showFavorite && <FavoriteButton opportunityId={o.id} className="absolute top-2 right-2 z-20" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge kind="opportunity" status={o.status} />
            {o.reference && <span className="text-xs text-muted-foreground">Réf. {o.reference}</span>}
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-snug">
            <Link to={`/opportunites/${o.slug}`} className="after:absolute after:inset-0 hover:text-primary">
              {o.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-muted/70 p-3 text-center sm:grid-cols-3">
            <div>
              <dt className="label-caps text-muted-foreground">Ticket estimé</dt>
              <dd className="tabular mt-1 font-bold text-primary">{formatAmount(o.estimatedInvestment, o.currency)}</dd>
            </div>
            <div>
              <dt className="label-caps text-muted-foreground">Modèle</dt>
              <dd className="mt-1 truncate text-xs font-medium">{o.investmentModel ?? "—"}</dd>
            </div>
            <div className="hidden sm:block">
              <dt className="label-caps text-muted-foreground">Type</dt>
              <dd className="mt-1 truncate text-xs font-medium">{o.projectType ?? "—"}</dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {location}
            </span>
            <span className={cn(buttonVariants({ size: "sm" }), "relative")}>
              Voir le projet <ArrowRight />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition hover:border-border-strong hover:shadow-hover",
        "before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[3px]", accent, className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <OpportunityCover
          coverKey={o.coverKey} sectorSlug={o.sectorSlug} title={o.title}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <StatusBadge kind="opportunity" status={o.status} className="bg-white/95" />
          {o.isFeatured && <span className="label-caps rounded bg-ochre px-2 py-1 text-white">En vedette</span>}
        </div>
        {showFavorite && <FavoriteButton opportunityId={o.id} className="absolute top-3 right-3 z-20" />}
        <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded bg-black/55 px-2 py-1 text-xs text-white">
          <MapPin className="size-3" /> {location}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="label-caps text-ochre">{o.sector}</p>
        <h3 className="mt-1.5 font-semibold leading-snug">
          <Link to={`/opportunites/${o.slug}`} className="after:absolute after:inset-0 hover:text-primary">
            {o.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
        <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Investissement estimé</dt>
            <dd className="tabular font-bold text-foreground">{formatAmount(o.estimatedInvestment, o.currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Modèle</dt>
            <dd className="truncate text-right font-medium">{o.investmentModel ?? "—"}</dd>
          </div>
        </dl>
        <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")}>
          Voir le projet <ArrowRight />
        </span>
      </div>
    </article>
  );
}
