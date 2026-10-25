import { HandHeart, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProfile } from "@/features/auth/hooks";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { InterestForm } from "./interest-form";

// Bouton « Je suis intéressé » : connexion requise, réservé aux investisseurs (section 9)
export function InterestDialog({
  opportunityId, opportunityTitle, slug, className, label = "Je suis intéressé", autoOpen = false,
}: {
  opportunityId: string;
  opportunityTitle: string;
  slug: string;
  className?: string;
  label?: string;
  /** Ouvre le formulaire au retour de connexion (une seule instance par page) */
  autoOpen?: boolean;
}) {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const classes = cn(buttonVariants(), "h-11 w-full px-5 text-[15px]", className);
  const isInvestor = session?.user.role === "investisseur";
  // Pré-remplissage depuis le profil investisseur
  const profile = useProfile({ enabled: isInvestor });

  // Retour de connexion depuis « Je suis intéressé » : ouvre directement le formulaire
  useEffect(() => {
    if (autoOpen && isInvestor && new URLSearchParams(window.location.search).get("interet") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
      const frame = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [autoOpen, isInvestor]);

  if (isPending) return <Skeleton className={cn("h-11 w-full", className)} />;

  if (!session) {
    return (
      <Link to={`/connexion?next=${encodeURIComponent(`/opportunites/${slug}?interet=1`)}`} className={classes}>
        <LogIn /> {label}
      </Link>
    );
  }

  if (!isInvestor) {
    return (
      <Button disabled className={classes} title="Réservé aux comptes investisseurs">
        <HandHeart /> {label}
      </Button>
    );
  }

  const [firstName, ...rest] = session.user.name.split(" ");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={classes} />}>
        <HandHeart /> {label}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Manifester mon intérêt</DialogTitle>
          <DialogDescription>
            Opportunité concernée : <b className="text-foreground">{opportunityTitle}</b>
          </DialogDescription>
        </DialogHeader>
        <InterestForm
          opportunityId={opportunityId}
          defaults={{
            firstName, lastName: rest.join(" "), email: session.user.email,
            phone: profile.data?.phone ?? (session.user.phone as string | null | undefined) ?? undefined,
            company: profile.data?.company ?? undefined,
            country: profile.data?.country ?? undefined,
          }}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
