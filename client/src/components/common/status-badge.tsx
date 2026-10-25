import { cn } from "@/lib/utils";
import {
  OPPORTUNITY_STATUS_LABELS, REQUEST_STATUS_LABELS, type OpportunityStatus, type RequestStatus,
} from "@/config/constants";

// Couleurs des « Status Badges » du DESIGN.md
const TONES = {
  draft: "bg-amber-50 text-amber-800 [--dot:#d97706]",
  review: "bg-blue-50 text-blue-800 [--dot:#3b82f6]",
  success: "bg-emerald-50 text-emerald-800 [--dot:#059669]",
  alert: "bg-red-50 text-red-800 [--dot:#dc2626]",
  neutral: "bg-slate-100 text-slate-700 [--dot:#64748b]",
} as const;

const OPPORTUNITY_TONE: Record<OpportunityStatus, keyof typeof TONES> = {
  brouillon: "draft",
  en_verification: "review",
  validee: "success",
  publiee: "success",
  suspendue: "alert",
  archivee: "neutral",
};

const REQUEST_TONE: Record<RequestStatus, keyof typeof TONES> = {
  nouvelle: "review",
  en_cours: "draft",
  contact_etabli: "success",
  en_attente: "neutral",
  traitee: "success",
  cloturee: "neutral",
};

type Props =
  | { kind: "opportunity"; status: string; className?: string }
  | { kind: "request"; status: string; className?: string };

export function StatusBadge({ kind, status, className }: Props) {
  const label = kind === "opportunity"
    ? OPPORTUNITY_STATUS_LABELS[status as OpportunityStatus]
    : REQUEST_STATUS_LABELS[status as RequestStatus];
  const tone = kind === "opportunity"
    ? OPPORTUNITY_TONE[status as OpportunityStatus]
    : REQUEST_TONE[status as RequestStatus];
  return (
    <span
      className={cn(
        "label-caps inline-flex items-center gap-1.5 rounded px-2 py-1 whitespace-nowrap",
        TONES[tone ?? "neutral"],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-(--dot)" aria-hidden />
      {label ?? status}
    </span>
  );
}
