import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";
import { authErrorMessage, postLoginPath } from "@/lib/auth-redirect";

const schema = z.object({
  email: z.email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  // Retour du lien de confirmation d'adresse avec une erreur (lien invalide ou expiré)
  const verifyError = searchParams.get("verifie") && searchParams.get("error");
  const [error, setError] = useState<string | null>(
    verifyError ? `${authErrorMessage({ code: verifyError })} Connectez-vous pour recevoir un nouveau lien de confirmation.` : null,
  );
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { data, error } = await signIn.email(values);
    if (error) return setError(authErrorMessage(error));
    navigate(postLoginPath(next, data?.user.role), { replace: true });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <FormField label="Adresse e-mail" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" className="h-11" {...register("email")} aria-invalid={!!errors.email} />
      </FormField>
      <div className="space-y-1.5">
        <FormField label="Mot de passe" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" className="h-11" {...register("password")} aria-invalid={!!errors.password} />
        </FormField>
        <Link to="/mot-de-passe-oublie" className="block text-right text-sm font-medium text-primary hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-[15px]">
        <LogIn /> {isSubmitting ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link to={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"} className="font-semibold text-primary hover:underline">
          Créer un compte investisseur
        </Link>
      </p>
    </form>
  );
}
