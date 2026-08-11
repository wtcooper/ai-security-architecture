import { Suspense } from "react";
import { ControlsBrowser } from "@/components/browse/ControlsBrowser";

export const metadata = { title: "Controls · CoSAI Risk Map Explorer" };

export default function ControlsPage() {
  return (
    <Suspense>
      <ControlsBrowser />
    </Suspense>
  );
}
