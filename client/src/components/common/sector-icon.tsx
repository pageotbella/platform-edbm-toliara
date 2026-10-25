import { createElement } from "react";
import { Briefcase, Cpu, Factory, Fish, Gem, Sun, TreePalm, Wheat, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  energie: Sun,
  agribusiness: Wheat,
  aquaculture: Fish,
  mines: Gem,
  tourisme: TreePalm,
  tic: Cpu,
  industrie: Factory,
};

function sectorIcon(slug: string | null | undefined): LucideIcon {
  return (slug && ICONS[slug]) || Briefcase;
}

export function SectorIcon({ slug, className }: { slug: string | null | undefined; className?: string }) {
  return createElement(sectorIcon(slug), { className, "aria-hidden": true });
}
