import { Suspense } from "react";
import { ArchitecturesBrowser } from "@/components/reference/ArchitecturesBrowser";

export const metadata = { title: "Reference architectures · AI Risk Map" };

export default function ReferencePage() {
  return (
    <Suspense>
      <ArchitecturesBrowser />
    </Suspense>
  );
}
