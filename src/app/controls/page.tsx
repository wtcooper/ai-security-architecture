import { Suspense } from "react";
import { ControlsBrowser } from "@/components/browse/ControlsBrowser";

export const metadata = { title: "Controls · AI Risk Map" };

export default function ControlsPage() {
  return (
    <Suspense>
      <ControlsBrowser />
    </Suspense>
  );
}
