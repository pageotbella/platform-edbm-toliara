import { toast } from "sonner";
import { OPPORTUNITY_STATUS_LABELS } from "@/config/constants";
import { useChangeOpportunityStatus } from "@/features/opportunities/hooks";

// Permissions et compteurs de l'agent connecté
export { useStaffMe } from "./hooks";

// Changement de statut d'une opportunité depuis le portefeuille ou l'éditeur (étape 5, section 18)
export function useChangeStatus() {
  return useChangeOpportunityStatus({
    onSuccess: (row) => toast.success(`Statut mis à jour : ${OPPORTUNITY_STATUS_LABELS[row.status]}`),
    onError: (e) => toast.error(e.message),
  });
}
