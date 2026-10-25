import { ArrowRight, Layers, MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { SimpleSelect } from "@/components/common/simple-select";
import { buttonVariants } from "@/components/ui/button";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OpportunityCardData } from "@/types";
import { OpportunityMap } from ".";
import { sectorColor } from "./sector-colors";

type RegionSummary = { id: string; name: string; total: number; sectors: { name: string; count: number }[] };

// Carte interactive (section 17) : régions, filtres, sélection d'une opportunité
export function MapExplorer({ points, regions }: { points: OpportunityCardData[]; regions: RegionSummary[] }) {
  const [sector, setSector] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sectors = useMemo(() => {
    const m = new Map<string, { id: string; name: string; slug: string; count: number }>();
    for (const p of points) {
      const s = m.get(p.sectorId) ?? { id: p.sectorId, name: p.sector, slug: p.sectorSlug, count: 0 };
      s.count++;
      m.set(p.sectorId, s);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [points]);

  const filtered = points.filter((p) => (!sector || p.sectorId === sector) && (!region || p.regionId === region));
  const selected = points.find((p) => p.id === selectedId);
  const activeRegion = regions.find((r) => r.id === region);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 space-y-4 lg:order-1">
        <div className="space-y-3 rounded-lg border bg-white p-4 shadow-card">
          <p className="label-caps text-muted-foreground">Filtres</p>
          <SimpleSelect
            value={sector} onChange={setSector} allLabel="Tous les secteurs"
            options={sectors.map((s) => ({ value: s.id, label: `${s.name} (${s.count})` }))}
          />
          <SimpleSelect
            value={region} onChange={(v) => { setRegion(v); setSelectedId(null); }} allLabel="Toutes les régions"
            options={regions.map((r) => ({ value: r.id, label: `${r.name} (${r.total})` }))}
          />
          <p className="text-xs text-muted-foreground"><b className="text-foreground">{filtered.length}</b> opportunité(s) affichée(s)</p>
        </div>

        {selected ? (
          <div className="overflow-hidden rounded-lg border bg-white shadow-card">
            <div className="h-1" style={{ background: sectorColor(selected.sectorSlug) }} />
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="label-caps" style={{ color: sectorColor(selected.sectorSlug) }}>{selected.sector}</p>
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <p className="font-semibold leading-snug">{selected.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {[selected.district, selected.region].filter(Boolean).join(", ")}
              </p>
              <p className="line-clamp-3 text-sm text-muted-foreground">{selected.description}</p>
              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <p className="label-caps text-muted-foreground">Ticket estimé</p>
                  <p className="tabular font-bold text-primary">{formatAmount(selected.estimatedInvestment, selected.currency)}</p>
                </div>
                <Link to={`/opportunites/${selected.slug}`} className={cn(buttonVariants({ size: "sm" }))}>
                  Voir le projet <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-4 shadow-card">
            <p className="mb-3 flex items-center gap-2 font-semibold"><Layers className="size-4 text-primary" /> Opportunités par région</p>
            <ul className="space-y-2">
              {(activeRegion ? [activeRegion] : regions).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setRegion(region === r.id ? null : r.id)}
                    className={cn("w-full rounded-md border p-3 text-left transition hover:border-border-strong", region === r.id && "border-primary bg-primary/5")}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold">{r.name}</span>
                      <span className="label-caps rounded bg-surface-low px-2 py-0.5 text-secondary">{r.total}</span>
                    </span>
                    <span className="mt-2 block space-y-1">
                      {r.sectors.map((s) => (
                        <span key={s.name} className="flex justify-between text-xs text-muted-foreground">
                          <span>→ {s.name}</span>
                          <span className="tabular">{s.count} opportunité{s.count > 1 ? "s" : ""}</span>
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border bg-white p-4 shadow-card">
          <p className="label-caps mb-2 text-muted-foreground">Légende des secteurs</p>
          <ul className="grid grid-cols-2 gap-1.5">
            {sectors.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full" style={{ background: sectorColor(s.slug) }} /> {s.name}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="order-1 overflow-hidden rounded-lg border bg-white p-2 shadow-card lg:order-2">
        <OpportunityMap
          points={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          className="h-[480px] lg:h-[calc(100vh-12rem)] lg:min-h-[560px]"
        />
      </div>
    </div>
  );
}
