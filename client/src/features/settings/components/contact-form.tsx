import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { useSendContactMessage } from "../hooks";
import { type ContactMessageInput, contactMessageSchema } from "../schemas";

// Formulaire de la page Contact : le message est transmis par e-mail à l'antenne EDBM
export function ContactForm() {
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    values: session ? { name: session.user.name, email: session.user.email, subject: "", message: "" } : undefined,
    resetOptions: { keepDirtyValues: true },
  });
  const send = useSendContactMessage({ onSuccess: () => { setSent(true); reset(); } });

  if (sent) {
    return (
      <div className="flex flex-col items-center py-8 text-center" role="status">
        <CheckCircle2 className="size-12 text-primary" />
        <p className="mt-4 text-lg font-bold">Message envoyé</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Merci, votre message a été transmis à l&apos;antenne EDBM Toliara. Un agent vous répondra à l&apos;adresse indiquée.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Écrire un autre message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => send.mutate(v))} className="space-y-4" noValidate>
      {send.error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{send.error.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nom complet" htmlFor="c-name" error={errors.name?.message} required>
          <Input id="c-name" autoComplete="name" className="h-11" {...register("name")} aria-invalid={!!errors.name} />
        </FormField>
        <FormField label="Adresse e-mail" htmlFor="c-email" error={errors.email?.message} required>
          <Input id="c-email" type="email" autoComplete="email" className="h-11" {...register("email")} aria-invalid={!!errors.email} />
        </FormField>
        <FormField label="Téléphone" htmlFor="c-phone" error={errors.phone?.message}>
          <Input id="c-phone" type="tel" autoComplete="tel" className="h-11" {...register("phone")} />
        </FormField>
        <FormField label="Organisation" htmlFor="c-company" error={errors.company?.message}>
          <Input id="c-company" autoComplete="organization" className="h-11" {...register("company")} />
        </FormField>
      </div>
      <FormField label="Objet" htmlFor="c-subject" error={errors.subject?.message} required>
        <Input id="c-subject" className="h-11" {...register("subject")} aria-invalid={!!errors.subject} />
      </FormField>
      <FormField label="Message" htmlFor="c-message" error={errors.message?.message} required>
        <Textarea id="c-message" rows={6} {...register("message")} aria-invalid={!!errors.message} />
      </FormField>
      {/* Champ piège : invisible pour les visiteurs, ignoré par les lecteurs d'écran */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" {...register("website")} />
      <Button type="submit" disabled={send.isPending} className="h-11 w-full text-[15px]">
        <Send /> {send.isPending ? "Envoi…" : "Envoyer le message"}
      </Button>
    </form>
  );
}
