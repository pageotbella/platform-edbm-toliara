// Complétude d'un dossier de projet : ce qui aide l'EDBM à l'instruire et les investisseurs à le comprendre
export type CompletenessInput = {
  description: string;
  estimatedInvestment: number | null;
  district: string | null;
  latitude: number | null;
  media: number;
  documents: number;
};

export type CompletenessItem = { label: string; ok: boolean };

export function completeness(p: CompletenessInput) {
  const items: CompletenessItem[] = [
    { label: "Présentation détaillée", ok: p.description.trim().length >= 120 },
    { label: "Montant recherché", ok: p.estimatedInvestment != null },
    { label: "District précisé", ok: !!p.district },
    { label: "Point sur la carte", ok: p.latitude != null },
    { label: "Au moins une photo", ok: p.media > 0 },
    { label: "Au moins un document", ok: p.documents > 0 },
  ];
  const done = items.filter((i) => i.ok).length;
  const ratio = done / items.length;
  // Note de A (complet) à F, comme un audit
  const grade = (["F", "E", "D", "C", "B", "A"] as const)[Math.round(ratio * 5)]!;
  return { items, done, total: items.length, ratio, grade };
}
