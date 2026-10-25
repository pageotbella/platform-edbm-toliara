import { Building2, FileText, MapPinned, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "description", label: "Description & enjeux", icon: FileText },
  { value: "localisation", label: "Localisation", icon: MapPinned },
  { value: "economie", label: "Informations économiques", icon: TrendingUp },
  { value: "documents", label: "Espace documentaire", icon: Building2 },
] as const;

// Onglets de la fiche (section 13) ; le contenu de chaque onglet est rendu côté serveur
export function DetailTabs({ panels }: { panels: Record<(typeof TABS)[number]["value"], React.ReactNode> }) {
  return (
    <Tabs defaultValue="description" className="gap-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg border bg-white p-1.5 shadow-card">
        {TABS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap text-slate-600 transition",
              "hover:bg-muted data-active:bg-primary data-active:text-white data-active:shadow-none",
            )}
          >
            <Icon className="size-4" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ value }) => (
        <TabsContent key={value} value={value}>{panels[value]}</TabsContent>
      ))}
    </Tabs>
  );
}
