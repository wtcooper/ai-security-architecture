import { Suspense } from "react";
import { FrameworksBrowser } from "@/components/browse/FrameworksBrowser";

export const metadata = { title: "Frameworks · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <FrameworksBrowser />
    </Suspense>
  );
}
