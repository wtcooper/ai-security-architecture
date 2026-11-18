import { Suspense } from "react";
import { ControlsBrowser } from "@/components/controls/ControlsBrowser";

export const metadata = { title: "Controls · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <ControlsBrowser />
    </Suspense>
  );
}
