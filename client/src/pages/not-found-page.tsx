import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <title>Page introuvable — EDBM Toliara</title>
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-low text-primary">
        <Compass className="size-7" />
      </span>
      <p className="label-caps mt-6 text-ochre">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Cette page n&apos;existe pas ou l&apos;opportunité n&apos;est plus publiée.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className={cn(buttonVariants(), "h-10 px-4")}>Retour à l&apos;accueil</Link>
        <Link to="/opportunites" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>Voir le catalogue</Link>
      </div>
    </div>
  );
}
