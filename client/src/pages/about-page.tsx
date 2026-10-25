import { Building2, Eye, Handshake, Layers, MapPinned, Search, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/common/kpi-card";
import { PageBand } from "@/components/layouts/page-band";
import { buttonVariants } from "@/components/ui/button";
import { useKeyFigures } from "@/features/opportunities/hooks";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const MISSIONS = [
  { icon: Layers, title: "Centraliser", text: "Réunir en un seul endroit les opportunités jusqu'ici dispersées entre brochures, fiches PDF et services régionaux." },
  { icon: Search, title: "Structurer et rechercher", text: "Classer les projets par secteur, région, district et commune, avec des filtres et une carte interactive." },
  { icon: Eye, title: "Valoriser", text: "Présenter chaque projet dans une fiche détaillée : données économiques, localisation, documents et photos." },
  { icon: Handshake, title: "Suivre", text: "Recevoir les demandes d'intérêt des investisseurs et assurer leur traitement jusqu'à la clôture." },
];

export function AboutPage() {
  const f = useKeyFigures().data;
  return (
    <>
      <title>À propos — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "À propos" }]}
        eyebrow="Economic Development Board of Madagascar"
        title="Une plateforme au service de l'investissement dans le Sud"
        description="L'EDBM promeut les investissements à Madagascar et accompagne les investisseurs. Son antenne régionale de Toliara anime cette plateforme pour rendre visibles les potentialités du Grand Sud."
      />
      <section className="container-page grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5 text-[15px] leading-7 text-slate-700">
          <h2 className="text-2xl font-bold text-foreground">Pourquoi cette plateforme ?</h2>
          <p>
            Les informations relatives aux opportunités d&apos;investissement (énergie, agribusiness, aquaculture, mines,
            tourisme, TIC, industrie…) existent sous des formes multiples : documents PDF, brochures, fiches projets ou
            informations communiquées par les représentations régionales. Leur consultation et leur mise à jour
            deviennent alors moins pratiques pour les investisseurs.
          </p>
          <p>
            Cette plateforme centralise, structure, présente et valorise ces opportunités, tout en offrant à
            l&apos;antenne EDBM Toliara un espace de gestion pour les mettre à jour, publier les dossiers et suivre les
            investisseurs intéressés.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/opportunites" className={cn(buttonVariants(), "h-10 px-4")}>Explorer les opportunités</Link>
            <Link to="/contact" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>Contacter l&apos;antenne</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 self-start">
          <KpiCard label="Projets publiés" value={f?.opportunities ?? "—"} icon={Layers} />
          <KpiCard label="Volume estimé" value={f ? formatAmount(f.totalInvestment) : "—"} icon={Building2} accent="ochre" />
          <KpiCard label="Investisseurs inscrits" value={f?.investors ?? "—"} icon={Users} accent="secondary" />
          <KpiCard label="Régions couvertes" value={f?.regions ?? "—"} icon={MapPinned} />
        </div>
      </section>
      <section className="border-t bg-white py-12">
        <div className="container-page">
          <h2 className="mb-8 text-2xl font-bold">Nos missions sur la plateforme</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {MISSIONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border bg-card p-6 shadow-card">
                <Icon className="size-6 text-primary" />
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Les données personnelles des investisseurs sont protégées et utilisées uniquement pour le traitement de leurs demandes.
          </p>
        </div>
      </section>
    </>
  );
}
