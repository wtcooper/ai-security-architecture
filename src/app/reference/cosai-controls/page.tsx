import { Suspense } from "react";
import { CosaiControlsBrowser } from "@/components/browse/CosaiControlsBrowser";

export const metadata = { title: "CoSAI controls · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <CosaiControlsBrowser />
    </Suspense>
  );
}
