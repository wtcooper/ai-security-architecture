import { Suspense } from "react";
import { FrameworksBrowser } from "@/components/browse/FrameworksBrowser";

export const metadata = { title: "Frameworks · AI Risk Map" };

export default function FrameworksPage() {
  return (
    <Suspense>
      <FrameworksBrowser />
    </Suspense>
  );
}
