import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFavorites, useToggleFavorite } from "../hooks";

// Icône favori (section 16) : visiteur → connexion ; agents et admins → masquée
export function FavoriteButton({
  opportunityId, className, variant = "icon",
}: {
  opportunityId: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const { session, isInvestor, ids } = useFavorites();
  const toggle = useToggleFavorite();
  const navigate = useNavigate();
  if (session && !isInvestor) return null;

  const active = ids.has(opportunityId);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      navigate(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    toggle.mutate({ opportunityId });
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={toggle.isPending}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 rounded border px-3 text-sm font-medium transition hover:bg-muted",
          active && "border-primary/30 bg-primary/5 text-primary",
          className,
        )}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
        {active ? "Dans mes favoris" : "Enregistrer"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={toggle.isPending}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-white/95 text-secondary shadow-sm transition hover:scale-105 hover:text-primary",
        active && "text-red-600 hover:text-red-700",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}
