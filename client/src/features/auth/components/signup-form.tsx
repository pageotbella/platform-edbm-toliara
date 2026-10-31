import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Lightbulb, TrendingUp, UserPlus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { authErrorMessage, postLoginPath } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
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
type SignupValues = z.input<typeof schema>;

export type AccountType = "investisseur" | "porteur";

const ACCOUNT_TYPES: { value: AccountType; label: string; text: string; icon: typeof Lightbulb }[] = [
  { value: "investisseur", label: "Je veux investir", text: "Favoris, demandes d'intérêt, suivi", icon: TrendingUp },
  { value: "porteur", label: "Je porte un projet", text: "Déposer et suivre mes projets", icon: Lightbulb },
];

// Trois étapes courtes : chacune est validée avant de passer à la suivante
const STEPS: { title: string; fields: FieldPath<SignupValues>[] }[] = [
  { title: "Profil", fields: ["firstName", "lastName"] },
  { title: "Coordonnées", fields: ["email", "phone"] },
  { title: "Sécurité", fields: ["password", "confirm", "terms"] },
];

// Inscription d'un investisseur ou d'un porteur de projet. Le serveur n'accepte que ces deux rôles
// (champ `accountType`, lu par un hook Better Auth) ; agents et administrateurs sont créés par l'admin.
export function SignupForm({ accountType, onAccountTypeChange }: {
  accountType: AccountType;
  onAccountTypeChange: (type: AccountType) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const last = step === STEPS.length - 1;

  const goNext = async () => {
    if (await trigger(STEPS[step]!.fields)) setStep((s) => s + 1);
  };

  const create = handleSubmit(async (v) => {
    setError(null);
    const { data, error } = await signUp.email({
      name: `${v.firstName} ${v.lastName}`, email: v.email, password: v.password, phone: v.phone || undefined,
      accountType,
    } as Parameters<typeof signUp.email>[0]);
    if (error) {
      // Adresse déjà utilisée : retour à l'étape où elle se corrige
      if (error.code?.startsWith("USER_ALREADY_EXISTS")) setStep(1);
      return setError(authErrorMessage(error));
    }
    // Adresse à confirmer avant la première connexion (lien envoyé par e-mail)
    if (!data?.token) return setSentTo(v.email);
    navigate(postLoginPath(next, accountType), { replace: true });
  });

  // Entrée valide l'étape en cours ; la création n'a lieu qu'à la dernière
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (last) return create(e);
    e.preventDefault();
    void goNext();
  };

  if (sentTo) return <EmailSent title="Confirmez votre adresse e-mail" email={sentTo}>
    Cliquez sur le lien reçu pour activer votre compte : vous serez connecté automatiquement. Le lien est valable 24 heures.
  </EmailSent>;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Progression */}
      <ol className="grid grid-cols-3 gap-2" aria-label={`Étape ${step + 1} sur ${STEPS.length} : ${STEPS[step]!.title}`}>
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className="group w-full text-left disabled:cursor-default"
            >
              <span className={cn("block h-1.5 rounded-full transition", i <= step ? "bg-primary" : "bg-border")} />
              <span className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-semibold",
                i === step ? "text-primary" : i < step ? "text-foreground group-hover:text-primary" : "text-muted-foreground",
              )}>
                {i < step ? <Check className="size-3.5" /> : <span className="tabular">{i + 1}.</span>} {s.title}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      {step === 0 && (
        <>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-secondary">Vous êtes</legend>
            <div className="grid grid-cols-2 gap-3" role="radiogroup">
              {ACCOUNT_TYPES.map(({ value, label, text, icon: Icon }) => (
                <button
                  key={value} type="button" role="radio" aria-checked={accountType === value}
                  onClick={() => onAccountTypeChange(value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border bg-white p-3 text-left transition",
                    accountType === value ? "border-primary bg-accent ring-1 ring-primary" : "hover:border-border-strong",
                  )}
                >
                  <Icon className={cn("size-5", accountType === value ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Prénom" htmlFor="firstName" error={errors.firstName?.message} required>
              <Input id="firstName" autoComplete="given-name" className="h-11" {...register("firstName")} aria-invalid={!!errors.firstName} />
            </FormField>
            <FormField label="Nom" htmlFor="lastName" error={errors.lastName?.message} required>
              <Input id="lastName" autoComplete="family-name" className="h-11" {...register("lastName")} aria-invalid={!!errors.lastName} />
            </FormField>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <FormField label="Adresse e-mail" htmlFor="email" error={errors.email?.message} required hint="Un lien de confirmation vous y sera envoyé.">
            <Input id="email" type="email" autoComplete="email" className="h-11" autoFocus {...register("email")} aria-invalid={!!errors.email} />
          </FormField>
          <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message} hint="Facultatif : pour que l'EDBM puisse vous joindre.">
            <Input id="phone" type="tel" autoComplete="tel" className="h-11" {...register("phone")} />
          </FormField>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Mot de passe" htmlFor="password" error={errors.password?.message} required>
              <Input id="password" type="password" autoComplete="new-password" className="h-11" autoFocus {...register("password")} aria-invalid={!!errors.password} />
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
        </>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" className="h-11 bg-white px-4" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft /> Retour
          </Button>
        )}
        {last ? (
          <Button type="submit" disabled={isSubmitting} className="h-11 flex-1 text-[15px]">
            <UserPlus /> {isSubmitting ? "Création du compte…" : accountType === "porteur" ? "Créer mon compte porteur" : "Créer mon compte investisseur"}
          </Button>
        ) : (
          <Button type="submit" className="h-11 flex-1 text-[15px]">
            Continuer <ArrowRight />
          </Button>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link to={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"} className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
