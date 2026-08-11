import { Suspense } from "react";
import { RisksBrowser } from "@/components/browse/RisksBrowser";

export const metadata = { title: "Risks · AI Risk Map" };

export default function RisksPage() {
  return (
    <Suspense>
      <RisksBrowser />
    </Suspense>
  );
}
