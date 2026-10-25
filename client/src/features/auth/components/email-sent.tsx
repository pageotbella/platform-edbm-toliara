import { MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Écran affiché après l'envoi d'un lien par e-mail (confirmation d'adresse, mot de passe oublié)
export function EmailSent({ title, email, children }: { title: string; email: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center shadow-card" role="status">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="size-6" />
      </span>
      <p className="mt-4 text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Un e-mail a été envoyé à <span className="font-semibold text-foreground">{email}</span>.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
      <p className="mt-4 text-xs text-muted-foreground">Rien reçu ? Vérifiez vos courriers indésirables.</p>
      <Link to="/connexion" className={cn(buttonVariants({ variant: "outline" }), "mt-5 h-10 w-full")}>Retour à la connexion</Link>
    </div>
  );
}
