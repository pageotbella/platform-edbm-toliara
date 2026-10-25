import { PageBand } from "@/components/layouts/page-band";
import { Catalog } from "../components/catalog";

export function CataloguePage() {
  return (
    <>
      <title>Catalogue des opportunités — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "Opportunités" }]}
        eyebrow="Catalogue des projets"
        title="Opportunités d'investissement"
        description="Recherchez par nom, secteur, région, district, commune ou mot-clé, puis affinez avec les filtres."
      />
      <div className="container-page py-8">
        <Catalog />
      </div>
    </>
  );
}
