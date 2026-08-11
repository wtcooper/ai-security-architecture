import { Suspense } from "react";
import { ComponentsBrowser } from "@/components/browse/ComponentsBrowser";

export const metadata = { title: "Components · AI Risk Map" };

export default function ComponentsPage() {
  return (
    <Suspense>
      <ComponentsBrowser />
    </Suspense>
  );
}
