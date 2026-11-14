import { Suspense } from "react";
import { RisksBrowser } from "@/components/browse/RisksBrowser";

export const metadata = { title: "Risks · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <RisksBrowser />
    </Suspense>
  );
}
