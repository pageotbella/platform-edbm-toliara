import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// Une seule série par graphique : une seule teinte (vert institutionnel), pas de palette catégorielle
const config = (label: string): ChartConfig => ({ n: { label, color: "var(--primary)" } });

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${y!.slice(2)}`;
};

/** Barres horizontales triées (magnitude par catégorie), valeur affichée en bout de barre. */
export function HBarChart({
  data, label, className, max = 8,
}: {
  data: { name: string; n: number }[];
  label: string;
  className?: string;
  max?: number;
}) {
  const rows = data.slice(0, max);
  if (!rows.length || rows.every((r) => r.n === 0)) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée pour le moment.</p>;
  }
  return (
    <ChartContainer config={config(label)} className={cn("aspect-auto w-full", className)} style={{ height: rows.length * 38 + 16 }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 36, top: 4, bottom: 4 }} barCategoryGap={8}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category" dataKey="name" width={120} tickLine={false} axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="n" fill="var(--color-n)" radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="n" position="right" className="fill-foreground" fontSize={12} fontWeight={600} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** Évolution mensuelle (série temporelle unique), avec infobulle au survol. */
export function MonthlyAreaChart({
  data, label, className,
}: {
  data: { month: string; n: number }[];
  label: string;
  className?: string;
}) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <ChartContainer config={config(label)} className={cn("aspect-auto h-64 w-full", className)}>
      <AreaChart data={rows} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-n)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-n)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <ChartTooltip cursor={{ stroke: "var(--border-strong)" }} content={<ChartTooltipContent indicator="line" />} />
        <Area dataKey="n" type="monotone" stroke="var(--color-n)" strokeWidth={2} fill="url(#fill-n)" activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} />
      </AreaChart>
    </ChartContainer>
  );
}
