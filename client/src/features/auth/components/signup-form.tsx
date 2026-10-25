import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { authErrorMessage, postLoginPath } from "@/lib/auth-redirect";
import { EmailSent } from "./email-sent";

const schema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().max(40).optional(),
  password: z.string().min(8, "8 caractères minimum"),
  confirm: z.string(),
  terms: z.literal(true, { error: "Vous devez accepter les conditions d'utilisation" }),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas" });

// Inscription : crée toujours un compte « investisseur » (le rôle n'est pas modifiable à l'inscription)
export function SignupForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const { data, error } = await signUp.email({
      name: `${v.firstName} ${v.lastName}`, email: v.email, password: v.password, phone: v.phone || undefined,
    });
    if (error) return setError(authErrorMessage(error));
    // Adresse à confirmer avant la première connexion (lien envoyé par e-mail)
    if (!data?.token) return setSentTo(v.email);
    navigate(postLoginPath(next, "investisseur"), { replace: true });
  });

  if (sentTo) return <EmailSent title="Confirmez votre adresse e-mail" email={sentTo}>
    Cliquez sur le lien reçu pour activer votre compte : vous serez connecté automatiquement. Le lien est valable 24 heures.
  </EmailSent>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prénom" htmlFor="firstName" error={errors.firstName?.message} required>
          <Input id="firstName" autoComplete="given-name" className="h-11" {...register("firstName")} aria-invalid={!!errors.firstName} />
        </FormField>
        <FormField label="Nom" htmlFor="lastName" error={errors.lastName?.message} required>
          <Input id="lastName" autoComplete="family-name" className="h-11" {...register("lastName")} aria-invalid={!!errors.lastName} />
        </FormField>
      </div>
      <FormField label="Adresse e-mail" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" className="h-11" {...register("email")} aria-invalid={!!errors.email} />
      </FormField>
      <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" autoComplete="tel" className="h-11" {...register("phone")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Mot de passe" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="new-password" className="h-11" {...register("password")} aria-invalid={!!errors.password} />
        </FormField>
        <FormField label="Confirmation" htmlFor="confirm" error={errors.confirm?.message} required>
          <Input id="confirm" type="password" autoComplete="new-password" className="h-11" {...register("confirm")} aria-invalid={!!errors.confirm} />
        </FormField>
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...register("terms")} />
          J&apos;accepte que mes informations soient utilisées par l&apos;EDBM pour le traitement de mes demandes.
        </label>
        {errors.terms && <p className="mt-1 text-xs text-destructive">{errors.terms.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-[15px]">
        <UserPlus /> {isSubmitting ? "Création du compte…" : "Créer mon compte investisseur"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link to={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"} className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
