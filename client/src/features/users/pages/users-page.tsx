import { useSearchParams } from "react-router-dom";
import { UsersView } from "../components/users-view";

// `?nouveau=1` ouvre le formulaire de création ; `?statut=desactive` filtre les comptes désactivés
export function UsersPage() {
  const [params] = useSearchParams();
  return (
    <UsersView
      initialCreate={params.get("nouveau") === "1"}
      initialStatus={params.get("statut") === "desactive" ? "desactive" : undefined}
    />
  );
}
