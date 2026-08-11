import { Suspense } from "react";
import { PersonasBrowser } from "@/components/browse/PersonasBrowser";

export const metadata = { title: "Personas · CoSAI Risk Map Explorer" };

export default function PersonasPage() {
  return (
    <Suspense>
      <PersonasBrowser />
    </Suspense>
  );
}
