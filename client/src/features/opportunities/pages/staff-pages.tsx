import { useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/page-header";
import { Catalog } from "../components/catalog";
import { OpportunityEditor } from "../components/opportunity-editor";

// Édition d'une opportunité ; `?etape=N` ouvre directement l'étape N (1 à 5)
export function EditOpportunityPage({ base = "/edbm" }: { base?: string }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const step = Number(params.get("etape"));
  // `key` : repart d'un formulaire neuf après création (même composant, autre id)
  return <OpportunityEditor key={id} id={id} base={base} initialStep={Number.isFinite(step) && step > 0 ? step - 1 : 0} />;
}

// Catalogue dans l'espace investisseur
export function InvestorCataloguePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace investisseur"
        title="Catalogue des opportunités"
        description="Recherchez et filtrez les opportunités publiées, puis enregistrez-les en favoris ou manifestez votre intérêt."
      />
      <Catalog />
    </div>
  );
}
