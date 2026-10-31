import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useContact } from "@/features/settings/hooks";
import { Logo } from "./logo";

export function SiteFooter() {
  const contact = useContact();
  return (
    <footer className="mt-auto border-t bg-surface-low">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm leading-6 text-muted-foreground">
            Plateforme de centralisation et de valorisation des opportunités d&apos;investissement, pilotée par
            l&apos;antenne régionale de l&apos;Economic Development Board of Madagascar à Toliara.
          </p>
          <p className="label-caps flex items-center gap-2 text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> Portail officiel
          </p>
        </div>
        <div>
          <p className="mb-4 font-semibold">Explorer</p>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/opportunites" className="hover:text-primary">Catalogue des opportunités</Link></li>
            <li><Link to="/carte" className="hover:text-primary">Carte interactive</Link></li>
            <li><Link to="/secteurs" className="hover:text-primary">Secteurs stratégiques</Link></li>
            <li><Link to="/regions" className="hover:text-primary">Régions et districts</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 font-semibold">Services aux investisseurs</p>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/inscription" className="hover:text-primary">Créer un compte investisseur</Link></li>
            <li><Link to="/investisseur/demandes" className="hover:text-primary">Suivre mes demandes</Link></li>
            <li><Link to="/inscription?type=porteur" className="hover:text-primary">Déposer un projet en ligne</Link></li>
            <li><Link to="/a-propos" className="hover:text-primary">Rôle de l&apos;EDBM</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contacter l&apos;antenne</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 font-semibold">{contact.name}</p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{contact.address}</li>
            <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-primary" />{contact.phone}</li>
            <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-primary" />{contact.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Economic Development Board of Madagascar (EDBM). Tous droits réservés.</p>
          <p>Antenne régionale de Toliara · Atsimo-Andrefana</p>
        </div>
      </div>
    </footer>
  );
}
