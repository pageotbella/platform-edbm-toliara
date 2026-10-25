import { Check, Pause } from "lucide-react";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/config/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Étapes linéaires du traitement (section 15) ; « en attente » suspend l'étape en cours
const STEPS: { status: RequestStatus; hint: string }[] = [
  { status: "nouvelle", hint: "Demande enregistrée et transmise à l'EDBM" },
  { status: "en_cours", hint: "Étude du dossier par un agent EDBM" },
  { status: "contact_etabli", hint: "Échange engagé avec l'investisseur" },
  { status: "traitee", hint: "Réponse apportée par l'EDBM" },
  { status: "cloturee", hint: "Dossier clôturé" },
];

const POSITION: Record<RequestStatus, number> = {
  nouvelle: 0, en_cours: 1, contact_etabli: 2, en_attente: 2, traitee: 3, cloturee: 4,
};

export function RequestStepper({
  status, createdAt, history,
}: {
  status: string;
  createdAt: string;
  history: { status: string; at: string }[];
}) {
  const current = POSITION[status as RequestStatus] ?? 0;
  const paused = status === "en_attente";
  const dateOf = (s: RequestStatus) => (s === "nouvelle" ? createdAt : history.find((h) => h.status === s)?.at);
  const progress = Math.round((current / (STEPS.length - 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Parcours de traitement</p>
        <span className="label-caps rounded bg-emerald-50 px-2 py-1 text-emerald-800">Avancement : {progress} %</span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((step, i) => {
          const done = i < current || (i === current && status === "cloturee");
          const active = i === current && !done;
          const date = dateOf(step.status);
          return (
            <li
              key={step.status}
              className={cn(
                "rounded-md border p-3",
                done && "border-emerald-200 bg-emerald-50/60",
                active && (paused ? "border-amber-300 bg-amber-50" : "border-primary bg-primary/5 ring-1 ring-primary"),
                !done && !active && "bg-white opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                    done ? "bg-emerald-600 text-white" : active ? (paused ? "bg-amber-500 text-white" : "bg-primary text-white") : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : active && paused ? <Pause className="size-3" /> : i + 1}
                </span>
                <span className="text-[11px] text-muted-foreground">{date ? formatDate(date) : active ? "En cours" : "À venir"}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {active && paused ? REQUEST_STATUS_LABELS.en_attente : REQUEST_STATUS_LABELS[step.status]}
              </p>
              <p className="text-xs text-muted-foreground">{active && paused ? "Dossier mis en attente par l'EDBM" : step.hint}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
