import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Building2, KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel } from "@/components/common/panel";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSectors } from "@/features/sectors/hooks";
import { authClient, useSession } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-redirect";
import { ROLE_LABELS, type Role } from "@/config/constants";
import { formatDate, initials } from "@/lib/format";
import { passwordChangeSchema, profileUpdateSchema, type ProfileUpdateInput } from "@/features/auth/profile-schemas";
import { useProfile, useUpdateProfile } from "../hooks";

function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(passwordChangeSchema) });
  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const { error } = await authClient.changePassword({
      currentPassword: v.currentPassword, newPassword: v.newPassword, revokeOtherSessions: true,
    });
    if (error) return setError(authErrorMessage(error));
    toast.success("Mot de passe modifié");
    reset();
  });
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <FormField label="Mot de passe actuel" htmlFor="currentPassword" error={errors.currentPassword?.message}>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
      </FormField>
      <FormField label="Nouveau mot de passe" htmlFor="newPassword" error={errors.newPassword?.message}>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
      </FormField>
      <FormField label="Confirmation" htmlFor="confirm" error={errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
      </FormField>
      <Button type="submit" variant="outline" disabled={isSubmitting} className="h-9 w-full">
        <KeyRound /> {isSubmitting ? "Modification…" : "Changer le mot de passe"}
      </Button>
      <p className="text-xs text-muted-foreground">Les autres sessions ouvertes seront déconnectées.</p>
    </form>
  );
}

// « Mon profil » (section 6.2) : informations personnelles, entreprise, sécurité
export function ProfileView({ showCompany = true }: { showCompany?: boolean }) {
  const profile = useProfile();
  const sectors = useSectors();
  const { refetch: refetchSession } = useSession();
  const update = useUpdateProfile();
  const { register, handleSubmit, reset, control, formState: { errors, isDirty } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    const p = profile.data;
    if (p) reset({
      name: p.name, phone: p.phone ?? "", company: p.company ?? "", country: p.country ?? "",
      interestSectorId: p.interestSectorId, description: p.description ?? "",
    });
  }, [profile.data, reset]);

  // Le nom affiché dans les menus vient de la session : on la recharge après l'enregistrement
  const onSave = (v: ProfileUpdateInput) =>
    update.mutate(v, {
      onSuccess: async () => {
        toast.success("Profil enregistré");
        await refetchSession();
      },
      onError: (e) => toast.error(e.message),
    });

  const p = profile.data;
  if (!p) return <PageSkeleton />;
  const complete = [p.name, p.phone, p.company, p.country, p.interestSectorId].filter(Boolean).length;
  const SaveButton = (
    <Button type="submit" form="profile-form" disabled={update.isPending || !isDirty} className="h-10 px-4">
      <Save /> {update.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mon compte"
        title={showCompany ? "Profil d'entreprise et représentant" : "Mon profil"}
        description={showCompany
          ? "Ces informations pré-remplissent vos demandes d'intérêt et aident l'EDBM à vous proposer des opportunités adaptées."
          : "Vos informations personnelles et la sécurité de votre compte."}
        actions={SaveButton}
      />

      <section className="flex flex-col gap-4 overflow-hidden rounded-lg bg-linear-to-r from-primary-dark to-primary p-6 text-white shadow-card md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">{initials(p.name)}</span>
          <div>
            <p className="flex items-center gap-2 text-lg font-bold"><BadgeCheck className="size-5 text-brand-light" /> {p.name}</p>
            <p className="text-sm text-white/80">{ROLE_LABELS[p.role as Role]} · membre depuis le {formatDate(p.createdAt)}</p>
          </div>
        </div>
        {showCompany && (
          <div className="rounded-md bg-white/10 px-4 py-2 text-sm">
            <p className="label-caps text-white/70">Profil complété</p>
            <p className="font-bold">{complete} / 5 informations clés</p>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form id="profile-form" onSubmit={handleSubmit(onSave)} className="space-y-6" noValidate>
          <Panel title="Représentant" icon={UserRound}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nom complet" htmlFor="name" error={errors.name?.message} required>
                <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
              </FormField>
              <FormField label="Adresse e-mail" htmlFor="email" hint="L'adresse de connexion ne peut pas être modifiée ici.">
                <Input id="email" value={p.email} disabled readOnly />
              </FormField>
              <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
              </FormField>
            </div>
          </Panel>

          {showCompany && (
            <Panel title="Entreprise et centres d'intérêt" icon={Building2}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Raison sociale" htmlFor="company" error={errors.company?.message}>
                  <Input id="company" autoComplete="organization" {...register("company")} />
                </FormField>
                <FormField label="Pays" htmlFor="country" error={errors.country?.message}>
                  <Input id="country" autoComplete="country-name" {...register("country")} />
                </FormField>
                <FormField
                  label="Secteur d'intérêt prioritaire" className="sm:col-span-2"
                  hint="Vous serez notifié lorsqu'une nouvelle opportunité est publiée dans ce secteur."
                >
                  <Controller
                    control={control}
                    name="interestSectorId"
                    render={({ field }) => (
                      <SimpleSelect
                        value={field.value ?? null}
                        onChange={field.onChange}
                        allLabel="Aucun secteur en particulier"
                        options={(sectors.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
                      />
                    )}
                  />
                </FormField>
                <FormField label="Présentation de l'entreprise" htmlFor="description" error={errors.description?.message} className="sm:col-span-2">
                  <Textarea id="description" rows={5} {...register("description")} placeholder="Activités, références, capacité d'investissement…" />
                </FormField>
              </div>
            </Panel>
          )}
          <div className="flex justify-end">{SaveButton}</div>
        </form>

        <aside className="space-y-6">
          <Panel title="Sécurité du compte" icon={ShieldCheck}>
            <PasswordForm />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
