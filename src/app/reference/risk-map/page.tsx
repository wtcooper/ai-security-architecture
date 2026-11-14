import { Suspense } from "react";
import { TourExplorer } from "@/components/tour/TourExplorer";

export const metadata = { title: "Risk map · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <TourExplorer />
    </Suspense>
  );
}
