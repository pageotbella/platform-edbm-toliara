import { type ComponentProps, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet est chargé à la demande, dans un fichier séparé du bundle principal
const OpportunityMapLazy = lazy(() => import("./opportunity-map"));
const LocationPickerLazy = lazy(() => import("./location-picker"));

export function OpportunityMap(props: ComponentProps<typeof OpportunityMapLazy>) {
  return (
    <Suspense fallback={<Skeleton className="h-full min-h-64 w-full rounded-lg" />}>
      <OpportunityMapLazy {...props} />
    </Suspense>
  );
}

export function LocationPicker(props: ComponentProps<typeof LocationPickerLazy>) {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
      <LocationPickerLazy {...props} />
    </Suspense>
  );
}

export type { MapPoint } from "./opportunity-map";
