import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/page-header";
import { spaceLabel } from "@/components/layouts/nav-config";
import { RequestDetail } from "../components/my-request-detail";
import { RequestPanel } from "../components/request-panel";

// Investisseur : suivi d'une demande (cible des notifications)
export function MyRequestPage() {
  const { id = "" } = useParams();
  return <RequestDetail id={id} />;
}

// Espace EDBM / administration : instruction d'une demande
export function StaffRequestPage({ base = "/edbm" }: { base?: string }) {
  const { id = "" } = useParams();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Demandes d'intérêt", href: `${base}/demandes` }, { label: "Instruction" }]}
        title="Instruction de la demande"
      />
      <div className="rounded-lg border bg-card p-5 shadow-card md:p-6">
        <RequestPanel id={id} base={base} />
      </div>
    </div>
  );
}
