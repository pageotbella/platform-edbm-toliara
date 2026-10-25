import { Download, FileText, Lock, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { useSession } from "@/lib/auth-client";
import { fileUrl, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTrackView } from "@/features/opportunities/hooks";

// Enregistre une consultation (statistiques) une seule fois par affichage
export function ViewTracker({ id }: { id: string }) {
  const track = useTrackView();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    track.mutate({ id });
  }, [id, track]);
  return null;
}

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* partage annulé */ }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers");
  };
  return (
    <button
      type="button"
      onClick={share}
      className={cn("inline-flex h-9 items-center justify-center gap-2 rounded border bg-white px-3 text-sm font-medium transition hover:bg-muted", className)}
    >
      <Share2 className="size-4" /> Partager
    </button>
  );
}

type Doc = {
  id: string; name: string; type: string | null; fileKey: string; mimeType: string | null;
  isPublic: boolean; createdAt: string;
};

const extOf = (key: string) => key.split(".").pop()?.toUpperCase().slice(0, 4) ?? "DOC";

// Documents d'une opportunité : les documents privés sont réservés aux utilisateurs connectés
export function DocumentList({ documents, slug }: { documents: Doc[]; slug: string }) {
  const { data: session } = useSession();
  if (!documents.length) {
    return <EmptyState icon={FileText} title="Aucun document disponible" description="Les documents de ce projet seront ajoutés par l'EDBM." />;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {documents.map((d) => {
        const locked = !d.isPublic && !session;
        return (
          <li key={d.id} className="flex items-center gap-3 rounded-lg border bg-white p-3">
            <span className="label-caps flex h-10 w-12 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">
              {extOf(d.fileKey)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.type ?? "Document"} · ajouté le {formatDate(d.createdAt)}
                {!d.isPublic && " · réservé aux membres"}
              </p>
            </div>
            {locked ? (
              <Link
                to={`/connexion?next=/opportunites/${slug}`}
                className="flex size-9 items-center justify-center rounded border text-muted-foreground hover:bg-muted"
                aria-label="Connexion requise"
                title="Connectez-vous pour télécharger"
              >
                <Lock className="size-4" />
              </Link>
            ) : (
              <a
                href={fileUrl(d.fileKey)}
                target="_blank"
                rel="noopener"
                className="flex size-9 items-center justify-center rounded bg-secondary text-white hover:bg-secondary/90"
                aria-label={`Télécharger ${d.name}`}
              >
                <Download className="size-4" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
