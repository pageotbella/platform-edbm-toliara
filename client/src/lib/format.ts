const compact = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

/** 18 400 000 → « 18,4 M USD » */
export function formatAmount(value: number | null | undefined, currency = "USD") {
  if (value == null) return "Non communiqué";
  if (value >= 1_000_000_000) return `${compact.format(value / 1_000_000_000)} Md ${currency}`;
  if (value >= 1_000_000) return `${compact.format(value / 1_000_000)} M ${currency}`;
  if (value >= 1_000) return `${compact.format(value / 1_000)} k ${currency}`;
  return `${full.format(value)} ${currency}`;
}

export function formatAmountFull(value: number | null | undefined, currency = "USD") {
  if (value == null) return "Non communiqué";
  return `${full.format(value)} ${currency}`;
}

export function formatNumber(value: number) {
  return full.format(value);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return dateTimeFmt.format(new Date(d));
}

/** URL d'un fichier téléversé (ou URL externe telle quelle) */
export function fileUrl(key: string) {
  return /^https?:\/\//.test(key) ? key : `/api/files/${key}`;
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

/** « il y a 2 heures » — à n'utiliser que côté client (dépend de l'heure courante). */
export function timeAgo(d: Date | string) {
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60], ["minute", 60], ["hour", 24], ["day", 30], ["month", 12], ["year", Infinity],
  ];
  let value = diff;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return formatDate(d);
}
