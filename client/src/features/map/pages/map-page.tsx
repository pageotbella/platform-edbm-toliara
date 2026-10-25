import { PageBand } from "@/components/layouts/page-band";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMapData } from "@/features/opportunities/hooks";
import { MapExplorer } from "../components/map-explorer";

function Explorer() {
  const { data } = useMapData();
  if (!data) return <Skeleton className="h-[600px] w-full rounded-lg" />;
  return <MapExplorer points={data.points} regions={data.regions} />;
}

// Carte interactive du portail public (section 17)
export function MapPage() {
  return (
    <>
      <title>Carte interactive — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "Carte interactive" }]}
        eyebrow="Outil géospatial"
        title="Carte interactive des opportunités"
        description="Visualisez les régions, localisez les projets et sélectionnez une opportunité directement depuis la carte."
      />
      <div className="container-page py-8">
        <Explorer />
      </div>
    </>
  );
}

// Même carte dans l'espace investisseur
export function InvestorMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace investisseur"
        title="Carte interactive"
        description="Localisez les opportunités par région et sélectionnez un projet directement sur la carte."
      />
      <Explorer />
    </div>
  );
}
