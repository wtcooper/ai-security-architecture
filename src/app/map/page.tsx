import { Suspense } from "react";
import { TourExplorer } from "@/components/tour/TourExplorer";

export const metadata = { title: "Risk Map · AI Risk Map" };

export default function MapPage() {
  return (
    <Suspense>
      <TourExplorer />
    </Suspense>
  );
}
