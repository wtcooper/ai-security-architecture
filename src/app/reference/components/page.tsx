import { Suspense } from "react";
import { ComponentsBrowser } from "@/components/browse/ComponentsBrowser";

export const metadata = { title: "Components · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <ComponentsBrowser />
    </Suspense>
  );
}
