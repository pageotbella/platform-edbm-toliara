import { Archive, CheckCircle2, Clock, Globe, PauseCircle, PencilLine, type LucideIcon } from "lucide-react";
import type { OpportunityStatus } from "@/config/constants";

// Le cycle de vie d'une opportunité, vu par le porteur de projet
export const PORTEUR_STATUS: Record<OpportunityStatus, { label: string; hint: string; pill: string; icon: LucideIcon }> = {
  brouillon: {
    label: "Brouillon", hint: "À compléter puis à transmettre à l'EDBM",
    pill: "border-amber-300 bg-amber-50 text-amber-800", icon: PencilLine,
  },
  en_verification: {
    label: "Transmis à l'EDBM", hint: "Un agent étudie votre projet",
    pill: "border-blue-300 bg-blue-50 text-blue-800", icon: Clock,
  },
  validee: {
    label: "Validé", hint: "Bientôt publié dans le catalogue",
    pill: "border-primary/40 bg-accent text-primary", icon: CheckCircle2,
  },
  publiee: {
    label: "Publié", hint: "Visible par les investisseurs",
    pill: "border-emerald-300 bg-emerald-50 text-emerald-800", icon: Globe,
  },
  suspendue: {
    label: "Suspendu", hint: "Temporairement retiré du catalogue",
    pill: "border-red-300 bg-red-50 text-red-700", icon: PauseCircle,
  },
  archivee: {
    label: "Archivé", hint: "Le projet n'est plus suivi",
    pill: "border-slate-300 bg-slate-50 text-slate-600", icon: Archive,
  },
};
