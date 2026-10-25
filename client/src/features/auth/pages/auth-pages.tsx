import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { postLoginPath } from "@/lib/auth-redirect";
import { AuthShell } from "../components/auth-shell";
import { LoginForm } from "../components/login-form";
import { ForgotPasswordForm, ResetPasswordForm } from "../components/password-forms";
import { SignupForm } from "../components/signup-form";

// Un utilisateur déjà connecté est renvoyé vers son espace (ou la page demandée)
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [params] = useSearchParams();
  // Retour du lien de confirmation d'adresse : la session vient d'être ouverte
  const verified = !!session && params.get("verifie") === "1" && !params.get("error");
  useEffect(() => {
    if (verified) toast.success("Adresse e-mail confirmée : bienvenue sur votre espace investisseur");
  }, [verified]);
  if (isPending) return <Skeleton className="h-72" />;
  if (session) return <Navigate to={postLoginPath(params.get("next"), session.user.role)} replace />;
  return children;
}

export function LoginPage() {
  return (
    <AuthShell title="Connexion" description="Accédez à votre espace investisseur ou à l'espace de gestion EDBM.">
      <title>Connexion — EDBM Toliara</title>
      <GuestOnly>
        <LoginForm />
      </GuestOnly>
    </AuthShell>
  );
}

export function SignupPage() {
  return (
    <AuthShell title="Créer un compte investisseur" description="Gratuit, en moins d'une minute. Vous pourrez compléter votre profil d'entreprise ensuite.">
      <title>Créer un compte — EDBM Toliara</title>
      <GuestOnly>
        <SignupForm />
      </GuestOnly>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthShell title="Mot de passe oublié" description="Indiquez l'adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.">
      <title>Mot de passe oublié — EDBM Toliara</title>
      <GuestOnly>
        <ForgotPasswordForm />
      </GuestOnly>
    </AuthShell>
  );
}

// Lien reçu par e-mail : réinitialisation, ou premier mot de passe d'un compte créé par un administrateur
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const welcome = params.get("bienvenue") === "1";
  return (
    <AuthShell
      title={welcome ? "Définir votre mot de passe" : "Nouveau mot de passe"}
      description={welcome
        ? "Votre compte a été créé par l'EDBM Toliara. Choisissez le mot de passe qui vous servira à vous connecter."
        : "Choisissez un nouveau mot de passe. Vos sessions ouvertes sur d'autres appareils seront fermées."}
    >
      <title>{`${welcome ? "Définir votre mot de passe" : "Nouveau mot de passe"} — EDBM Toliara`}</title>
      <ResetPasswordForm token={params.get("token")} welcome={welcome} />
    </AuthShell>
  );
}
