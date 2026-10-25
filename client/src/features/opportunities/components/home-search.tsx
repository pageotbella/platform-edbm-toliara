import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SimpleSelect, type Option } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogHref } from "@/lib/catalog-params";
import { INVESTMENT_TRANCHES } from "@/config/constants";

// Moteur de recherche de la page d'accueil (section 12.1) → catalogue filtré
export function HomeSearch({ sectors, regions, total }: { sectors: Option[]; regions: Option[]; total: number }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [secteur, setSecteur] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [tranche, setTranche] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(catalogHref({
          q: q.trim() || undefined, secteur: secteur ?? undefined, region: region ?? undefined,
          tranche: tranche ?? undefined,
        }));
      }}
      className="rounded-xl border bg-white p-5 shadow-overlay md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-secondary">
          <Search className="size-4 text-primary" /> Moteur territorial d&apos;opportunités d&apos;investissement
        </p>
        <span className="label-caps text-muted-foreground">{total} projets publiés</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="space-y-1.5">
          <span className="label-caps text-muted-foreground">Recherche mots-clés</span>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex. solaire, Morombe, algues…"
            className="h-10 bg-white"
          />
        </label>
        <div className="space-y-1.5">
          <span className="label-caps text-muted-foreground">Secteur</span>
          <SimpleSelect value={secteur} onChange={setSecteur} options={sectors} allLabel="Tous les secteurs" />
        </div>
        <div className="space-y-1.5">
          <span className="label-caps text-muted-foreground">Région</span>
          <SimpleSelect value={region} onChange={setRegion} options={regions} allLabel="Toutes les régions" />
        </div>
        <div className="space-y-1.5">
          <span className="label-caps text-muted-foreground">Ticket d&apos;investissement</span>
          <SimpleSelect
            value={tranche}
            onChange={setTranche}
            options={INVESTMENT_TRANCHES.map((t) => ({ value: t.id, label: t.label }))}
            allLabel="Tout montant"
          />
        </div>
        <Button type="submit" className="h-10 self-end px-5">
          <Search /> Rechercher
        </Button>
      </div>
    </form>
  );
}
