import { Suspense } from "react";
import { PersonasBrowser } from "@/components/browse/PersonasBrowser";

export const metadata = { title: "Personas · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <PersonasBrowser />
    </Suspense>
  );
}
