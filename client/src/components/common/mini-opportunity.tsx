import { Link } from "react-router-dom";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OpportunityCover } from "./opportunity-cover";

type Mini = {
  slug: string; title: string; sector: string; sectorSlug: string; region: string;
  district?: string | null; coverKey: string | null; estimatedInvestment: number | null; currency: string;
};

// Ligne compacte d'opportunité (listes latérales des tableaux de bord)
export function MiniOpportunity({ o, className }: { o: Mini; className?: string }) {
  return (
    <Link to={`/opportunites/${o.slug}`} className={cn("flex items-center gap-3 rounded-md p-2 transition hover:bg-muted", className)}>
      <span className="size-12 shrink-0 overflow-hidden rounded">
        <OpportunityCover coverKey={o.coverKey} sectorSlug={o.sectorSlug} title={o.title} iconClassName="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm font-semibold">{o.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{o.sector} · {o.district ?? o.region}</span>
      </span>
      <span className="tabular shrink-0 text-xs font-bold text-primary">{formatAmount(o.estimatedInvestment, o.currency)}</span>
    </Link>
  );
}
