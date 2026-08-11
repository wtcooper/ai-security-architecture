import { Suspense } from "react";
import { TourExplorer } from "@/components/tour/TourExplorer";

export default function MapPage() {
  return (
    <Suspense>
      <TourExplorer />
    </Suspense>
  );
}
