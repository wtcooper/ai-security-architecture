import { Suspense } from "react";
import { CloudsBrowser } from "@/components/cloud/CloudsBrowser";

export const metadata = { title: "Clouds · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <CloudsBrowser />
    </Suspense>
  );
}
