import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/form-field";
import { useCreateInterestRequest } from "../hooks";
import { interestRequestSchema, type InterestRequestInput } from "../schemas";

// Formulaire « Je suis intéressé » (section 14)
export function InterestForm({
  opportunityId, defaults, onSuccess,
}: {
  opportunityId: string;
  defaults?: Partial<InterestRequestInput>;
  onSuccess?: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<InterestRequestInput>({
    resolver: zodResolver(interestRequestSchema),
    defaultValues: { ...defaults, opportunityId },
  });

  const create = useCreateInterestRequest();
  const submit = (v: InterestRequestInput) =>
    create.mutate(v, {
      onSuccess: () => {
        toast.success("Votre demande a été envoyée", {
          description: "L'antenne EDBM Toliara vous recontactera. Suivez son état dans « Mes demandes ».",
        });
        onSuccess?.();
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormField label="Prénom" htmlFor="firstName" error={errors.firstName?.message} required>
        <Input id="firstName" autoComplete="given-name" {...register("firstName")} aria-invalid={!!errors.firstName} />
      </FormField>
      <FormField label="Nom" htmlFor="lastName" error={errors.lastName?.message} required>
        <Input id="lastName" autoComplete="family-name" {...register("lastName")} aria-invalid={!!errors.lastName} />
      </FormField>
      <FormField label="Adresse e-mail" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
      </FormField>
      <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message} required>
        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!errors.phone} />
      </FormField>
      <FormField label="Entreprise" htmlFor="company" error={errors.company?.message} required>
        <Input id="company" autoComplete="organization" {...register("company")} aria-invalid={!!errors.company} />
      </FormField>
      <FormField label="Pays" htmlFor="country" error={errors.country?.message} required>
        <Input id="country" autoComplete="country-name" {...register("country")} aria-invalid={!!errors.country} />
      </FormField>
      <FormField
        label="Montant d'investissement envisagé (USD)" htmlFor="amount" error={errors.amount?.message}
        className="sm:col-span-2"
      >
        <Input
          id="amount" type="number" step="any" min={0} inputMode="decimal"
          {...register("amount", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
          aria-invalid={!!errors.amount}
        />
      </FormField>
      <FormField label="Message" htmlFor="message" error={errors.message?.message} className="sm:col-span-2"
        hint="Précisez vos attentes : visite de site, dossier technique, rendez-vous…">
        <Textarea id="message" rows={4} {...register("message")} />
      </FormField>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={create.isPending} className="h-10 px-5">
          <Send /> {create.isPending ? "Envoi…" : "Envoyer ma demande"}
        </Button>
      </div>
    </form>
  );
}
