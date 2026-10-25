import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FileUp, Save, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FormField } from "@/components/common/form-field";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { contactSettingsSchema } from "@/features/users/schemas";
import { useContactSettings, useUpdateContact } from "@/features/settings/hooks";

type Contact = z.infer<typeof contactSettingsSchema>;

// Paramètres système (section 6.4 « modifier certains paramètres du système »)
export function SettingsView() {
  const qc = useQueryClient();
  const { data } = useContactSettings();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Contact>({ resolver: zodResolver(contactSettingsSchema) });

  useEffect(() => {
    if (data) reset({ name: data.name, address: data.address, email: data.email, phone: data.phone, hours: data.hours });
  }, [data, reset]);

  const save = useUpdateContact({
    onSuccess: (_d, v) => { toast.success("Paramètres enregistrés — visibles sur le portail public"); reset(v); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e) => toast.error(e.message),
  });
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Administration", href: "/admin" }, { label: "Paramètres" }]}
        eyebrow="Configuration"
        title="Paramètres système"
        description="Coordonnées affichées sur le portail public (en-tête, pied de page, contact, fiches projets) et règles de la plateforme."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Coordonnées de l'antenne EDBM" icon={Building2} description={data.updatedAt ? `Dernière modification : ${formatDateTime(data.updatedAt)}` : "Valeurs par défaut"}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
            <FormField label="Nom de l'antenne" htmlFor="s-name" error={errors.name?.message} required className="md:col-span-2">
              <Input id="s-name" {...register("name")} />
            </FormField>
            <FormField label="Adresse" htmlFor="s-address" error={errors.address?.message} required className="md:col-span-2">
              <Input id="s-address" {...register("address")} />
            </FormField>
            <FormField label="E-mail" htmlFor="s-email" error={errors.email?.message} required>
              <Input id="s-email" type="email" {...register("email")} />
            </FormField>
            <FormField label="Téléphone (guichet unique)" htmlFor="s-phone" error={errors.phone?.message} required>
              <Input id="s-phone" {...register("phone")} />
            </FormField>
            <FormField label="Horaires d'ouverture" htmlFor="s-hours" error={errors.hours?.message} required className="md:col-span-2">
              <Input id="s-hours" {...register("hours")} />
            </FormField>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" className="h-10 px-4" disabled={!isDirty || save.isPending}><Save /> {save.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
            </div>
          </form>
        </Panel>

        <aside className="space-y-6">
          <Panel title="Authentification et sessions" icon={ShieldCheck}>
            <dl className="space-y-2 text-sm">
              {[
                ["Mots de passe", "Hachés (jamais stockés en clair)"], ["Longueur minimale", "8 caractères"],
                ["Durée de session", "7 jours, renouvelée chaque jour"], ["Compte désactivé", "Connexion refusée, sessions fermées"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b pb-2 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          </Panel>
          <Panel title="Règles de téléversement" icon={FileUp}>
            <dl className="space-y-2 text-sm">
              {[
                ["Images", "PNG, JPEG, WebP · 5 Mo"], ["Documents", "PDF, Word, Excel, PowerPoint · 20 Mo"],
                ["Contrôle du contenu", "Signature du fichier vérifiée"], ["Documents privés", "Réservés aux utilisateurs connectés"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b pb-2 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Ces règles sont fixées dans le code de la plateforme (section 33 du cahier des charges).</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
