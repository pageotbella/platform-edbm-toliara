// Couleur des marqueurs de la carte par secteur
export const SECTOR_COLORS: Record<string, string> = {
  energie: "#d97706",
  agribusiness: "#0a5c36",
  aquaculture: "#0284c7",
  mines: "#7c3aed",
  tourisme: "#49607c",
  tic: "#0f2942",
  industrie: "#7b4100",
};

export const sectorColor = (slug: string | null | undefined) => (slug && SECTOR_COLORS[slug]) || "#64748b";
