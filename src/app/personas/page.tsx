import { Suspense } from "react";
import { PersonasBrowser } from "@/components/browse/PersonasBrowser";

export const metadata = { title: "Personas · AI Risk Map" };

export default function PersonasPage() {
  return (
    <Suspense>
      <PersonasBrowser />
    </Suspense>
  );
}
