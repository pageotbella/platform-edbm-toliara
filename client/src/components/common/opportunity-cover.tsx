import { fileUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectorIcon } from "./sector-icon";

// Visuel d'une opportunité : image de couverture, ou motif aux couleurs du secteur à défaut
export function OpportunityCover({
  coverKey, sectorSlug, title, className, iconClassName,
}: {
  coverKey: string | null | undefined;
  sectorSlug: string | null | undefined;
  title: string;
  className?: string;
  iconClassName?: string;
}) {
  if (coverKey) {
    return <img src={fileUrl(coverKey)} alt={title} className={cn("size-full object-cover", className)} loading="lazy" />;
  }
  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden bg-linear-to-br from-primary via-primary-dark to-secondary",
        className,
      )}
      role="img"
      aria-label={title}
    >
      <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="absolute -right-8 -bottom-10 size-40 rounded-full bg-ochre/25 blur-2xl" />
      <SectorIcon slug={sectorSlug} className={cn("relative size-14 text-white/85", iconClassName)} />
    </div>
  );
}
