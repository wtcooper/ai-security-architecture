import { Suspense } from "react";
import { ComponentsBrowser } from "@/components/browse/ComponentsBrowser";

export const metadata = { title: "Components · CoSAI Risk Map Explorer" };

export default function ComponentsPage() {
  return (
    <Suspense>
      <ComponentsBrowser />
    </Suspense>
  );
}
