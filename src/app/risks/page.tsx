import { Suspense } from "react";
import { RisksBrowser } from "@/components/browse/RisksBrowser";

export const metadata = { title: "Risks · CoSAI Risk Map Explorer" };

export default function RisksPage() {
  return (
    <Suspense>
      <RisksBrowser />
    </Suspense>
  );
}
