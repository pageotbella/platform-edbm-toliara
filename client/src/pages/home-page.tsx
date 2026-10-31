import { Anchor, ArrowRight, BadgeCheck, Building2, ClipboardList, Compass, FilePlus2, FileSearch, Handshake, Layers, Lightbulb, MapPinned, Plane, Plug, Rocket, Sun, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/common/kpi-card";
import { OpportunityCard } from "@/components/common/opportunity-card";
import { SectionTitle } from "@/components/common/page-header";
import { SectorIcon } from "@/components/common/sector-icon";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityMap } from "@/features/map/components";
import { HomeSearch } from "@/features/opportunities/components/home-search";
import { useFeaturedOpportunities, useKeyFigures, useMapData } from "@/features/opportunities/hooks";
import { useRegionsSummary } from "@/features/regions/hooks";
import { useSectorsSummary } from "@/features/sectors/hooks";
import { formatAmount, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const JOURNEY = [
  { icon: FileSearch, title: "Identification", text: "Recherchez par secteur, région ou montant et consultez les fiches détaillées des projets." },
  { icon: Handshake, title: "Manifestation d'intérêt", text: "Créez votre compte investisseur et envoyez une demande d'intérêt en quelques minutes." },
  { icon: ClipboardList, title: "Accompagnement", text: "Un agent de l'antenne EDBM Toliara prend contact et suit votre dossier jusqu'à son traitement." },
  { icon: Rocket, title: "Concrétisation", text: "Mise en relation avec les porteurs de projet, les collectivités et les services de l'État." },
];

const HUB_ASSETS = [
  { icon: Anchor, title: "Port en eau profonde", text: "Débouché naturel vers le canal de Mozambique, l'Afrique de l'Est et l'Asie." },
  { icon: Plug, title: "Connectivité RN7 / RN9", text: "Axes routiers reliant Toliara aux bassins agricoles et miniers du Sud." },
  { icon: Plane, title: "Aéroport international", text: "Liaisons quotidiennes avec Antananarivo et l'Océan Indien." },
  { icon: Sun, title: "Ensoleillement record", text: "Plus de 3 000 heures de soleil par an : un atout pour l'énergie solaire." },
];

const dash = (v: number | undefined, f: (n: number) => string = String) => (v == null ? "—" : f(v));

export function HomePage() {
  const figures = useKeyFigures().data;
  const sectors = useSectorsSummary().data;
  const regions = useRegionsSummary().data;
  const featured = useFeaturedOpportunities(3);
  const map = useMapData().data;
  const atsimo = regions?.find((r) => r.name === "Atsimo-Andrefana");

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-gradient relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,200,230,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(74,40,88,0.85),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="container-page relative grid gap-10 pt-14 pb-36 lg:grid-cols-[1.6fr_1fr] lg:pt-20">
          <div className="space-y-6">
            <p className="label-caps inline-flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-brand-light">
              <span className="size-1.5 rounded-full bg-brand-light" /> Guichet unique régional décentralisé
            </p>
            <h1 className="text-[32px] leading-10 font-extrabold tracking-tight md:text-5xl md:leading-[56px]">
              Valoriser le potentiel économique du <span className="text-brand-light">Grand Sud</span> et de Madagascar
            </h1>
            <p className="max-w-2xl text-lg leading-7 text-white/80">
              La plateforme officielle de l&apos;antenne régionale EDBM Toliara pour découvrir, comparer et suivre les
              opportunités d&apos;investissement structurées par secteur et par région.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/opportunites" className={cn(buttonVariants(), "h-11 bg-white px-5 text-primary hover:bg-white/90")}>
                <Compass /> Explorer les opportunités
              </Link>
              <Link to="/carte" className={cn(buttonVariants(), "h-11 border-white/30 bg-white/10 px-5 hover:bg-white/20")}>
                <MapPinned /> Voir la carte interactive
              </Link>
            </div>
          </div>
          <aside className="self-end rounded-xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="label-caps text-white/70">Pôle régional</p>
              <span className="label-caps rounded bg-ochre px-2 py-0.5 text-white">Toliara Hub</span>
            </div>
            <p className="mt-3 text-2xl font-bold">Atsimo-Andrefana</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Carrefour maritime du canal de Mozambique, réservoir d&apos;énergie solaire et pôle agro-halieutique du
              Sud-Ouest.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
              <div>
                <dt className="label-caps text-white/60">Projets publiés</dt>
                <dd className="tabular mt-1 text-2xl font-bold">{atsimo?.count ?? 0}</dd>
              </div>
              <div>
                <dt className="label-caps text-white/60">Volume estimé</dt>
                <dd className="tabular mt-1 text-2xl font-bold">{formatAmount(atsimo?.total ?? 0)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* Moteur de recherche + chiffres clés */}
      <section className="container-page relative -mt-24">
        <HomeSearch
          sectors={(sectors ?? []).map((s) => ({ value: s.id, label: s.name }))}
          regions={(regions ?? []).map((r) => ({ value: r.id, label: r.name }))}
          total={figures?.opportunities ?? 0}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Projets répertoriés" value={dash(figures?.opportunities, formatNumber)} icon={Layers}
            hint="Dossiers publiés et consultables librement" />
          <KpiCard label="Volume d'investissement" value={dash(figures?.totalInvestment, (n) => formatAmount(n))} icon={TrendingUp}
            accent="ochre" hint="Montant cumulé des projets publiés" />
          <KpiCard label="Secteurs stratégiques" value={dash(figures?.sectors)} unit="filières" icon={Building2}
            accent="secondary" hint="Énergie, agribusiness, mines, tourisme…" />
          <KpiCard label="Régions couvertes" value={dash(figures?.regions)} icon={MapPinned}
            hint={`${formatNumber(figures?.requests ?? 0)} demandes d'intérêt reçues`} />
        </div>
      </section>

      {/* Secteurs */}
      <section className="container-page py-20">
        <SectionTitle
          eyebrow="Piliers de croissance régionale"
          title="Les secteurs stratégiques"
          description="Un écosystème d'opportunités doté d'avantages comparatifs uniques : rayonnement solaire, littoral préservé, gisements miniers et terres agricoles."
          action={<Link to="/secteurs" className="text-sm font-semibold text-primary hover:underline">Tous les secteurs →</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectors
            ? sectors.map((s) => (
                <Link
                  key={s.id}
                  to={`/secteurs/${s.slug}`}
                  className="group flex flex-col rounded-lg border bg-card p-5 shadow-card transition hover:border-border-strong hover:shadow-hover"
                >
                  <span className="flex size-10 items-center justify-center rounded bg-surface-low text-primary transition group-hover:bg-primary group-hover:text-white">
                    <SectorIcon slug={s.slug} className="size-5" />
                  </span>
                  <p className="mt-4 font-semibold">{s.name}</p>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-muted-foreground">{s.description}</p>
                  <p className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                    <span className="font-semibold text-secondary">{s.count} projet{s.count > 1 ? "s" : ""}</span>
                    <ArrowRight className="size-4 text-primary transition group-hover:translate-x-0.5" />
                  </p>
                </Link>
              ))
            : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </section>

      {/* Projets en vedette */}
      <section className="border-y bg-white py-20">
        <div className="container-page">
          <SectionTitle
            eyebrow="Dossiers qualifiés"
            title="Projets phares en vedette"
            description="Fiches d'opportunités complètes, validées par l'antenne EDBM Toliara."
            action={<Link to="/opportunites" className={cn(buttonVariants({ variant: "outline" }), "h-9")}>Voir tout le catalogue</Link>}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.data
              ? featured.data.map((o) => <OpportunityCard key={o.id} o={o} />)
              : Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96 rounded-lg" />)}
          </div>
        </div>
      </section>

      {/* Carte */}
      <section className="bg-surface-low py-20">
        <div className="container-page">
          <SectionTitle
            eyebrow="Outil géospatial d'aide à la décision"
            title="Cartographie interactive des opportunités"
            description="Localisez les projets, visualisez leur répartition par région et accédez directement à leur fiche."
          />
          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
            <div className="relative overflow-hidden rounded-xl border bg-white p-2 shadow-card">
              <OpportunityMap points={map?.points ?? []} className="h-[420px]" interactive={false} />
              <Link
                to="/carte"
                className={cn(buttonVariants(), "absolute right-5 bottom-5 z-[400] h-10 px-4 shadow-hover")}
              >
                <MapPinned /> Ouvrir la carte plein écran
              </Link>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-card">
              <p className="mb-4 flex items-center gap-2 font-semibold">
                <BadgeCheck className="size-5 text-primary" /> Atouts géostratégiques du hub Toliara
              </p>
              <ul className="space-y-4">
                {HUB_ASSETS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-ochre" />
                    <p className="text-sm"><span className="font-semibold">{title}</span> — <span className="text-muted-foreground">{text}</span></p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2 border-t pt-5">
                <p className="label-caps text-muted-foreground">Répartition par région</p>
                {(map?.regions ?? []).slice(0, 4).map((r) => (
                  <Link key={r.id} to={`/regions/${r.id}`} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted">
                    <span className="font-medium">{r.name}</span>
                    <span className="tabular text-muted-foreground">{r.total} projet{r.total > 1 ? "s" : ""}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parcours investisseur */}
      <section className="container-page py-20">
        <SectionTitle
          className="mx-auto text-center md:flex-col md:items-center"
          eyebrow="Guichet unique dématérialisé"
          title="Le parcours investisseur avec l'EDBM Toliara"
          description="Un accompagnement de bout en bout, de la découverte du projet jusqu'à sa mise en œuvre."
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-lg border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded bg-primary text-sm font-bold text-white">{i + 1}</span>
                <Icon className="size-5 text-ochre" />
              </div>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Porteurs de projet : dépôt en ligne */}
      <section className="container-page pb-10">
        <div className="flex flex-col gap-6 rounded-xl border bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex gap-5">
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary sm:flex">
              <Lightbulb className="size-7" />
            </span>
            <div className="max-w-2xl space-y-2">
              <p className="label-caps text-primary">Porteurs de projet</p>
              <h2 className="text-2xl font-bold">Vous portez un projet mais ne pouvez pas venir à l&apos;antenne ?</h2>
              <p className="text-muted-foreground">
                Déposez-le en ligne, avec photos et documents. Un agent de l&apos;EDBM Toliara l&apos;étudie et vous tient
                informé par e-mail jusqu&apos;à sa publication dans le catalogue.
              </p>
            </div>
          </div>
          <Link to="/inscription?type=porteur" className={cn(buttonVariants(), "h-11 shrink-0 px-5")}>
            <FilePlus2 /> Déposer un projet
          </Link>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="container-page pb-20">
        <div className="bg-brand-gradient relative overflow-hidden rounded-xl px-6 py-10 text-white md:px-12">
          <div className="absolute -top-20 -right-20 size-72 rounded-full bg-brand-light/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="label-caps text-brand-light">Accompagnement sur mesure</p>
              <h2 className="text-2xl font-bold md:text-3xl">Vous souhaitez investir dans le Sud de Madagascar ?</h2>
              <p className="text-white/80">
                Créez votre compte investisseur pour enregistrer vos projets favoris, manifester votre intérêt et suivre
                le traitement de vos demandes par l&apos;EDBM.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link to="/inscription" className={cn(buttonVariants(), "h-11 bg-white px-5 text-primary hover:bg-white/90")}>
                Créer mon compte investisseur
              </Link>
              <Link to="/contact" className={cn(buttonVariants(), "h-11 border-white/30 bg-white/10 px-5 hover:bg-white/20")}>
                Contacter l&apos;antenne
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
