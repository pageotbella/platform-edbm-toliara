import { useQueryClient } from "@tanstack/react-query";
import {
  Building2, ExternalLink, Globe2, Hand, Lock, Mail, MapPin, MessageSquareText, Phone, Save, Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { RequestStepper } from "@/features/interest-requests/components/request-stepper";
import { FormField } from "@/components/common/form-field";
import { SimpleSelect } from "@/components/common/simple-select";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/config/constants";
import { formatAmount, formatDate, formatDateTime, initials } from "@/lib/format";
import { useProcessRequest, useStaffRequest, useTakeRequest } from "@/features/interest-requests/hooks";

// Traitement d'une demande d'intérêt par un agent (sections 14 et 15)
export function RequestPanel({ id, base = "/edbm" }: { id: string; base?: string }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const { data: r, isPending, error } = useStaffRequest({ id }, { retry: false });
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ["interest-requests"] }),
    qc.invalidateQueries({ queryKey: ["stats"] }),
    qc.invalidateQueries({ queryKey: ["staff"] }),
  ]);
  const take = useTakeRequest({
    onSuccess: () => { toast.success("Demande prise en charge"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (isPending) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-40" /><Skeleton className="h-60" /></div>;
  if (error || !r) return <p className="text-sm text-muted-foreground">Demande introuvable.</p>;

  const mine = r.handledBy === session?.user.id;
  const fullName = [r.firstName, r.lastName].filter(Boolean).join(" ") || r.investor?.name || "Investisseur";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <StatusBadge kind="request" status={r.status} />
        <span>Reçue le {formatDateTime(r.createdAt)}</span>
        {r.handledByName && <span>· Suivie par <b className="text-foreground">{r.handledByName}</b></span>}
      </div>

      {/* Investisseur */}
      <section className="rounded-lg bg-surface-low/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">{initials(fullName)}</span>
          <div className="min-w-0">
            <p className="font-semibold">{fullName}</p>
            <p className="text-sm text-secondary">{r.company ?? "—"}</p>
            {r.country && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Globe2 className="size-3" /> {r.country}</p>}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {r.email && <a href={`mailto:${r.email}`} className="flex items-center gap-2 truncate rounded bg-white px-3 py-2 text-xs hover:text-primary"><Mail className="size-3.5 shrink-0" />{r.email}</a>}
          {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-2 rounded bg-white px-3 py-2 text-xs hover:text-primary"><Phone className="size-3.5 shrink-0" />{r.phone}</a>}
        </div>
        {r.investor && <p className="mt-2 text-[11px] text-muted-foreground">Compte investisseur créé le {formatDate(r.investor.since)}</p>}
      </section>

      {/* Opportunité visée */}
      <section className="rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="label-caps text-muted-foreground">Opportunité visée</p>
          <span className="label-caps text-muted-foreground">Réf. {r.reference ?? "—"}</span>
        </div>
        <Link to={`${base}/opportunites/${r.opportunityId}`} className="mt-1 block font-semibold hover:text-primary">{r.opportunity}</Link>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Building2 className="size-3" />{r.sector}</span>
          <span className="flex items-center gap-1"><MapPin className="size-3" />{[r.district, r.region].filter(Boolean).join(", ")}</span>
          <span className="flex items-center gap-1"><Wallet className="size-3" />Projet : {formatAmount(r.estimatedInvestment, r.currency)}</span>
        </p>
        <div className="mt-3 flex items-center justify-between rounded bg-primary/5 px-3 py-2">
          <span className="text-xs text-muted-foreground">Montant envisagé par l&apos;investisseur</span>
          <span className="tabular font-bold text-primary">{formatAmount(r.amount, r.currency)}</span>
        </div>
        {r.opportunityStatus === "publiee" && (
          <Link to={`/opportunites/${r.slug}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Fiche publique <ExternalLink className="size-3" />
          </Link>
        )}
      </section>

      <section>
        <p className="label-caps mb-2 text-muted-foreground">Message de l&apos;investisseur</p>
        <blockquote className="rounded-lg border-l-4 border-secondary bg-surface-low/60 p-4 text-sm leading-6 whitespace-pre-line italic">
          {r.message || "Aucun message."}
        </blockquote>
      </section>

      <section className="rounded-lg bg-surface-low/60 p-4">
        <RequestStepper status={r.status} createdAt={r.createdAt} history={r.history} />
      </section>

      {/* Actions de l'agent */}
      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Actions de traitement</p>
          {!mine && (
            <Button type="button" variant="outline" size="sm" disabled={take.isPending} onClick={() => take.mutate({ id: r.id })}>
              <Hand /> Prendre en charge
            </Button>
          )}
        </div>
        {/* Clé : repart des valeurs enregistrées après chaque mise à jour */}
        <ProcessForm key={`${r.id}-${String(r.updatedAt)}`} request={r} onSaved={refresh} />
      </section>

      {r.history.length > 0 && (
        <section>
          <p className="label-caps mb-2 text-muted-foreground">Historique</p>
          <ol className="space-y-1.5 text-xs">
            {r.history.map((h, i) => (
              <li key={i} className="flex justify-between gap-3 border-b pb-1.5 last:border-0">
                <span><b>{REQUEST_STATUS_LABELS[h.status as RequestStatus] ?? h.status}</b>{h.by ? ` · ${h.by}` : ""}</span>
                <span className="text-muted-foreground">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function ProcessForm({ request: r, onSaved }: {
  request: { id: string; status: RequestStatus; edbmResponse: string | null; internalNote: string | null };
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<RequestStatus>(r.status);
  const [response, setResponse] = useState(r.edbmResponse ?? "");
  const [note, setNote] = useState(r.internalNote ?? "");
  const process = useProcessRequest({
    onSuccess: () => { toast.success("Demande mise à jour — l'investisseur est notifié des changements"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  const dirty = status !== r.status || response !== (r.edbmResponse ?? "") || note !== (r.internalNote ?? "");
  return (
    <>
      <FormField label="Statut du dossier">
        <SimpleSelect value={status} onChange={(v) => v && setStatus(v as RequestStatus)}
          options={(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] }))} />
      </FormField>
      <FormField label={<span className="flex items-center gap-1.5"><MessageSquareText className="size-3.5" /> Réponse à l&apos;investisseur</span>} hint="Visible par l'investisseur dans « Mes demandes » ; il est notifié à l'enregistrement.">
        <Textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Ex. Un rendez-vous de présentation vous est proposé…" />
      </FormField>
      <FormField label={<span className="flex items-center gap-1.5"><Lock className="size-3.5" /> Note interne confidentielle</span>} hint="Visible uniquement par l'équipe EDBM.">
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observations pour l'équipe…" className="bg-amber-50/40" />
      </FormField>
      <Button
        type="button" className="h-10 w-full" disabled={!dirty || process.isPending}
        onClick={() => process.mutate({ id: r.id, status, edbmResponse: response, internalNote: note })}
      >
        <Save /> {process.isPending ? "Enregistrement…" : "Enregistrer le traitement"}
      </Button>
    </>
  );
}
