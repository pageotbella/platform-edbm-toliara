import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, resetPassword } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-redirect";
import { EmailSent } from "./email-sent";

const alertClass = "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700";

const forgotSchema = z.object({ email: z.email("Adresse e-mail invalide") });

// « Mot de passe oublié » : la réponse est la même que le compte existe ou non
export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    const { error } = await requestPasswordReset({ email });
    if (error) return setError(authErrorMessage(error));
    setSentTo(email);
  });

  if (sentTo) return <EmailSent title="Vérifiez votre boîte de réception" email={sentTo}>
    Si un compte est associé à cette adresse, le lien de réinitialisation est valable 1 heure.
  </EmailSent>;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <p className={alertClass} role="alert">{error}</p>}
      <FormField label="Adresse e-mail du compte" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" className="h-11" autoFocus {...register("email")} aria-invalid={!!errors.email} />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-[15px]">
        <Send /> {isSubmitting ? "Envoi…" : "Recevoir le lien de réinitialisation"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link to="/connexion" className="font-semibold text-primary hover:underline">Retour à la connexion</Link>
      </p>
    </form>
  );
}

const resetSchema = z.object({
  password: z.string().min(8, "8 caractères minimum").max(128),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas" });

// Nouveau mot de passe à partir du jeton reçu par e-mail (réinitialisation ou compte créé par un admin)
export function ResetPasswordForm({ token, welcome }: { token: string | null; welcome: boolean }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) });

  if (!token) {
    return (
      <div className="space-y-4">
        <p className={alertClass} role="alert">Ce lien est incomplet. Ouvrez le lien reçu par e-mail ou demandez-en un nouveau.</p>
        <Link to="/mot-de-passe-oublie" className="block text-center text-sm font-semibold text-primary hover:underline">Demander un nouveau lien</Link>
      </div>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    const { error } = await resetPassword({ newPassword: password, token });
    if (error) return setError(authErrorMessage(error));
    toast.success(welcome ? "Mot de passe enregistré : vous pouvez vous connecter" : "Mot de passe modifié : connectez-vous avec le nouveau");
    navigate("/connexion", { replace: true });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && (
        <div className={alertClass} role="alert">
          {error}{" "}
          <Link to="/mot-de-passe-oublie" className="font-semibold underline">Demander un nouveau lien</Link>
        </div>
      )}
      <FormField label="Nouveau mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères minimum.">
        <Input id="password" type="password" autoComplete="new-password" className="h-11" autoFocus {...register("password")} aria-invalid={!!errors.password} />
      </FormField>
      <FormField label="Confirmation" htmlFor="confirm" error={errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" className="h-11" {...register("confirm")} aria-invalid={!!errors.confirm} />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-[15px]">
        <KeyRound /> {isSubmitting ? "Enregistrement…" : welcome ? "Définir mon mot de passe" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
