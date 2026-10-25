import {
  Banknote, Briefcase, Building, Download, Layers, Mail, MapPin, Phone, ShieldCheck, Star, Target,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { KpiCard } from "@/components/common/kpi-card";
import { OpportunityCard } from "@/components/common/opportunity-card";
import { OpportunityCover } from "@/components/common/opportunity-cover";
import { Breadcrumbs } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { InterestDialog } from "@/features/interest-requests/components/interest-dialog";
import { OpportunityMap } from "@/features/map/components";
import { useContact } from "@/features/settings/hooks";
import { fileUrl, formatAmount, formatAmountFull, formatDate } from "@/lib/format";
import { NotFoundPage } from "@/pages/not-found-page";
import { DocumentList, ShareButton, ViewTracker } from "../components/detail-client";
import { DetailTabs } from "../components/detail-tabs";
import { useOpportunity } from "../hooks";

function DetailSkeleton() {
  return (
    <div className="container-page space-y-6 py-10">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-12 w-3/4" />
      <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-96" />
    </div>
  );
}

function InfoBlock({ title, children, icon: Icon }: { title: string; children?: string | null; icon: typeof Target }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border bg-surface-low/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-secondary">
        <Icon className="size-4 text-primary" /> {title}
      </p>
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-700">{children}</p>
    </div>
  );
}

// Fiche détaillée d'une opportunité publiée (section 13)
export function OpportunityDetailPage() {
  const { slug = "" } = useParams();
  const { data: o, isPending, isError } = useOpportunity(slug);
  const contact = useContact();

  if (isPending) return <DetailSkeleton />;
  if (isError || !o) return <NotFoundPage />;

  const location = [o.commune, o.district, o.region].filter(Boolean).join(", ");
  const cover = o.media[0];
  const brochure = o.documents.find((d) => d.isPublic);
  const point = {
    id: o.id, slug: o.slug, title: o.title, sector: o.sector, sectorSlug: o.sectorSlug, region: o.region,
    district: o.district, estimatedInvestment: o.estimatedInvestment, currency: o.currency,
    latitude: o.latitude, longitude: o.longitude,
  };

  return (
    <>
      <title>{`${o.title} — EDBM Toliara`}</title>
      <ViewTracker id={o.id} />
      <div className="border-b bg-surface-low">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2.5">
          <Breadcrumbs items={[{ label: "Opportunités", href: "/opportunites" }, { label: o.sector, href: `/secteurs/${o.sectorSlug}` }, { label: o.title }]} />
          {o.reference && <span className="label-caps text-secondary">Réf. {o.reference}</span>}
        </div>
      </div>

      {/* En-tête */}
      <section className="border-b bg-white">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="label-caps rounded bg-primary px-2 py-1 text-white">{o.sector}</span>
              <span className="label-caps flex items-center gap-1 rounded bg-secondary/10 px-2 py-1 text-secondary">
                <MapPin className="size-3" /> {o.district ?? o.region}
              </span>
              <StatusBadge kind="opportunity" status={o.status} />
              {o.isFeatured && (
                <span className="label-caps flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-amber-800">
                  <Star className="size-3" /> Projet stratégique
                </span>
              )}
            </div>
            <h1 className="text-[28px] leading-9 font-bold tracking-tight md:text-4xl md:leading-[44px]">{o.title}</h1>
            <p className="max-w-3xl text-lg leading-7 text-slate-600">{o.description}</p>
            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {o.subSector && <div className="flex gap-1.5"><dt className="text-muted-foreground">Sous-secteur :</dt><dd className="font-semibold">{o.subSector}</dd></div>}
              {o.projectType && <div className="flex gap-1.5"><dt className="text-muted-foreground">Type de projet :</dt><dd className="font-semibold">{o.projectType}</dd></div>}
              {o.publishedAt && <div className="flex gap-1.5"><dt className="text-muted-foreground">Publié le :</dt><dd className="font-semibold">{formatDate(o.publishedAt)}</dd></div>}
            </dl>
          </div>
          <aside className="h-fit space-y-3 rounded-xl border bg-surface-low p-5">
            <div className="flex items-center justify-between">
              <p className="label-caps text-muted-foreground">Instruction ouverte</p>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" /> Guichet Toliara actif
              </span>
            </div>
            <InterestDialog opportunityId={o.id} opportunityTitle={o.title} slug={o.slug} autoOpen />
            <div className="grid grid-cols-2 gap-2">
              <FavoriteButton opportunityId={o.id} variant="full" className="bg-white" />
              <ShareButton title={o.title} />
            </div>
            {brochure && (
              <a href={fileUrl(brochure.fileKey)} target="_blank" rel="noopener"
                className="flex h-9 items-center justify-center gap-2 rounded border bg-white text-sm font-medium hover:bg-muted">
                <Download className="size-4" /> {brochure.name}
              </a>
            )}
            <p className="flex gap-2 border-t pt-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              Votre demande est transmise à l&apos;antenne EDBM Toliara et traitée de manière confidentielle.
            </p>
          </aside>
        </div>
      </section>

      {/* Indicateurs */}
      <section className="bg-surface-low py-8">
        <div className="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Investissement estimé" icon={Banknote} value={formatAmount(o.estimatedInvestment, o.currency)}
            hint={formatAmountFull(o.estimatedInvestment, o.currency)} />
          <KpiCard label="Modèle d'investissement" icon={Briefcase} accent="secondary"
            value={<span className="text-lg">{o.investmentModel ?? "À définir"}</span>} />
          <KpiCard label="Type de projet" icon={Layers} accent="ochre"
            value={<span className="text-lg">{o.projectType ?? "—"}</span>} hint={o.subSector} />
          <KpiCard label="Localisation" icon={MapPin} value={<span className="text-lg">{o.district ?? o.region}</span>} hint={location} />
        </div>
      </section>

      {/* Onglets */}
      <section className="container-page py-10">
        <DetailTabs
          panels={{
            description: (
              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-5 rounded-lg border bg-white p-6 shadow-card md:p-8">
                  <p className="label-caps text-ochre">Contexte du projet</p>
                  <p className="text-[15px] leading-7 whitespace-pre-line text-slate-700">{o.description}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBlock title="Potentiel économique" icon={Target}>{o.potential}</InfoBlock>
                    <InfoBlock title="Marché cible" icon={Building}>{o.targetMarket}</InfoBlock>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
                    <OpportunityCover coverKey={cover?.fileKey} sectorSlug={o.sectorSlug} title={o.title} iconClassName="size-20" />
                    {cover?.title && (
                      <p className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 p-4 text-sm font-semibold text-white">{cover.title}</p>
                    )}
                  </div>
                  {o.media.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {o.media.slice(1, 7).map((m) => (
                        <a key={m.id} href={fileUrl(m.fileKey)} target="_blank" rel="noopener" className="aspect-square overflow-hidden rounded border">
                          <img src={fileUrl(m.fileKey)} alt={m.title ?? o.title} className="size-full object-cover transition hover:scale-105" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
            localisation: (
              <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
                <dl className="space-y-3 rounded-lg border bg-white p-6 shadow-card">
                  {[
                    ["Région", o.region], ["District", o.district], ["Commune", o.commune],
                    ["Coordonnées", o.latitude != null && o.longitude != null ? `${o.latitude.toFixed(4)}, ${o.longitude.toFixed(4)}` : null],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b pb-3 last:border-0">
                      <dt className="text-sm text-muted-foreground">{k}</dt>
                      <dd className="tabular text-right text-sm font-semibold">{v ?? "—"}</dd>
                    </div>
                  ))}
                  <InfoBlock title="Avantages de la zone" icon={Star}>{o.zoneAdvantages}</InfoBlock>
                </dl>
                <div className="overflow-hidden rounded-lg border bg-white p-2 shadow-card">
                  {o.latitude != null ? (
                    <OpportunityMap points={[point]} className="h-[380px]" maxZoom={9} />
                  ) : (
                    <p className="p-10 text-center text-sm text-muted-foreground">Coordonnées géographiques non renseignées.</p>
                  )}
                </div>
              </div>
            ),
            economie: (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-white p-5 shadow-card">
                  <p className="label-caps text-muted-foreground">Investissement estimé</p>
                  <p className="tabular mt-2 text-2xl font-bold text-primary">{formatAmountFull(o.estimatedInvestment, o.currency)}</p>
                  <p className="mt-3 text-sm text-muted-foreground">Modèle : <b className="text-foreground">{o.investmentModel ?? "À définir"}</b></p>
                </div>
                <InfoBlock title="Potentiel économique" icon={Target}>{o.potential}</InfoBlock>
                <InfoBlock title="Marché cible" icon={Building}>{o.targetMarket}</InfoBlock>
                <InfoBlock title="Ressources disponibles" icon={Layers}>{o.resources}</InfoBlock>
                <InfoBlock title="Infrastructures existantes" icon={Building}>{o.infrastructures}</InfoBlock>
                <InfoBlock title="Avantages de la zone" icon={Star}>{o.zoneAdvantages}</InfoBlock>
              </div>
            ),
            documents: <DocumentList documents={o.documents} slug={o.slug} />,
          }}
        />

        {/* Contact EDBM */}
        <div className="mt-10 flex flex-col gap-5 rounded-xl border bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><Building className="size-6" /></span>
            <div>
              <p className="label-caps text-ochre">Interlocuteur dédié</p>
              <p className="font-semibold">{contact.name}</p>
              <p className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="size-3" />{contact.phone}</span>
                <span className="flex items-center gap-1"><Mail className="size-3" />{contact.email}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`mailto:${contact.email}?subject=${encodeURIComponent(`[${o.reference ?? "Opportunité"}] ${o.title}`)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded bg-surface-low px-4 text-sm font-semibold text-secondary hover:bg-accent"
            >
              <Mail className="size-4" /> Contacter l&apos;EDBM
            </a>
            <div className="sm:w-56">
              <InterestDialog opportunityId={o.id} opportunityTitle={o.title} slug={o.slug} label="Déposer mon intérêt" />
            </div>
          </div>
        </div>
      </section>

      {o.similar.length > 0 && (
        <section className="border-t bg-white py-12">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold">Opportunités similaires</h2>
              <Link to={`/secteurs/${o.sectorSlug}`} className="text-sm font-semibold text-primary hover:underline">Tout le secteur {o.sector} →</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {o.similar.map((s) => <OpportunityCard key={s.id} o={s} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
