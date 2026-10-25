import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false, subtitle = "Antenne Atsimo-Andrefana" }: {
  className?: string;
  inverted?: boolean;
  subtitle?: string;
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="EDBM Toliara — accueil">
      <img src="/logo-edbm-96.png" alt="" width={40} height={40} className="size-10 shrink-0" />
      <span className="leading-tight">
        <span className={cn("block text-[15px] font-bold", inverted ? "text-white" : "text-foreground")}>EDBM Toliara</span>
        <span className={cn("label-caps block text-[9px]", inverted ? "text-white/70" : "text-muted-foreground")}>
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
