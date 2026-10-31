import type { OpportunityStatus } from "@/config/constants";

// Le cycle de vie d'une opportunité, vu par le porteur de projet
export const PORTEUR_STATUS: Record<OpportunityStatus, { label: string; hint: string; tone: string }> = {
  brouillon: { label: "Brouillon", hint: "À compléter puis à transmettre à l'EDBM", tone: "bg-amber-50 text-amber-800" },
  en_verification: { label: "Transmis à l'EDBM", hint: "Un agent étudie votre projet", tone: "bg-blue-50 text-blue-800" },
  validee: { label: "Validé", hint: "Bientôt publié dans le catalogue", tone: "bg-accent text-primary" },
  publiee: { label: "Publié", hint: "Visible par les investisseurs", tone: "bg-emerald-50 text-emerald-800" },
  suspendue: { label: "Suspendu", hint: "Temporairement retiré du catalogue", tone: "bg-red-50 text-red-800" },
  archivee: { label: "Archivé", hint: "Le projet n'est plus suivi", tone: "bg-slate-100 text-slate-700" },
};
