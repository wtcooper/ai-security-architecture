import { Suspense } from "react";
import { ControlsBrowser } from "@/components/browse/ControlsBrowser";

export const metadata = { title: "CoSAI controls · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <ControlsBrowser />
    </Suspense>
  );
}
