import type { PartnerProject } from "@/types";

export type ProjectPhase = "en_cours" | "a_venir" | "termine";

// Phase déduite des années de début et de fin (précision à l'année)
export function projectPhase(p: Pick<PartnerProject, "startYear" | "endYear">, year = new Date().getFullYear()): ProjectPhase {
  if (p.startYear && p.startYear > year) return "a_venir";
  if (p.endYear && p.endYear < year) return "termine";
  return "en_cours";
}

export const PHASE: Record<ProjectPhase, { label: string; className: string }> = {
  en_cours: { label: "En cours", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  a_venir: { label: "À venir", className: "border-blue-200 bg-blue-50 text-blue-800" },
  termine: { label: "Terminé", className: "border-slate-200 bg-slate-100 text-slate-600" },
};

export const periodLabel = (p: Pick<PartnerProject, "startYear" | "endYear">) =>
  p.startYear && p.endYear ? `${p.startYear} – ${p.endYear}` : p.startYear ? `Depuis ${p.startYear}` : p.endYear ? `Jusqu'en ${p.endYear}` : "Période non précisée";
