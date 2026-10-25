import { Clock, Mail, MapPin, Phone, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { PageBand } from "@/components/layouts/page-band";
import { buttonVariants } from "@/components/ui/button";
import { ContactForm } from "@/features/settings/components/contact-form";
import { useContact } from "@/features/settings/hooks";
import { cn } from "@/lib/utils";

export function ContactPage() {
  const c = useContact();
  const items = [
    { icon: MapPin, label: "Adresse", value: c.address },
    { icon: Phone, label: "Téléphone (guichet unique)", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "E-mail", value: c.email, href: `mailto:${c.email}` },
    { icon: Clock, label: "Horaires d'ouverture", value: c.hours },
  ];
  return (
    <>
      <title>Contact — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "Contact" }]}
        eyebrow="Guichet unique régional"
        title="Contacter l'EDBM Toliara"
        description="Pour toute question sur une opportunité, un projet d'investissement ou les démarches administratives, l'antenne régionale vous accueille et vous oriente."
      />
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-xl font-bold">Écrire à l&apos;antenne</h2>
          <p className="mt-1 text-sm text-muted-foreground">Votre message est transmis directement à l&apos;équipe de l&apos;EDBM Toliara.</p>
          <div className="mt-6"><ContactForm /></div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-white p-6 shadow-card md:p-8">
            <h2 className="text-xl font-bold">{c.name}</h2>
            <ul className="mt-6 space-y-5">
              {items.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary"><Icon className="size-5" /></span>
                  <div>
                    <p className="label-caps text-muted-foreground">{label}</p>
                    {href ? <a href={href} className="font-semibold hover:text-primary">{value}</a> : <p className="font-semibold">{value}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-gradient rounded-xl p-6 text-white md:p-8">
            <p className="label-caps text-brand-light">Vous êtes investisseur ?</p>
            <p className="mt-2 text-xl font-bold">Manifestez votre intérêt directement depuis une fiche projet</p>
            <p className="mt-2 text-sm text-white/80">
              Avec un compte investisseur, vos demandes sont enregistrées, transmises à un agent EDBM et suivies dans votre
              tableau de bord.
            </p>
            <Link to="/inscription" className={cn(buttonVariants(), "mt-5 h-10 bg-white px-4 text-primary hover:bg-white/90")}>
              <UserPlus /> Créer mon compte
            </Link>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-card">
            <p className="font-semibold">Questions fréquentes</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="font-semibold">Comment suivre ma demande ?</dt><dd className="mt-1 text-muted-foreground">Dans votre espace investisseur, rubrique « Mes demandes », avec l&apos;historique de son état.</dd></div>
              <div><dt className="font-semibold">Certains documents sont verrouillés ?</dt><dd className="mt-1 text-muted-foreground">Ils sont réservés aux utilisateurs connectés : créez un compte gratuit pour y accéder.</dd></div>
              <div><dt className="font-semibold">Vous portez un projet ?</dt><dd className="mt-1 text-muted-foreground">Contactez l&apos;antenne : un agent EDBM étudiera son inscription au catalogue.</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
