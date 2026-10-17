import { Suspense } from "react";
import { EnableBrowser } from "@/components/enable/EnableBrowser";

export const metadata = { title: "Enable · AI Security Architecture" };

export default function EnablePage() {
  return (
    <Suspense>
      <EnableBrowser />
    </Suspense>
  );
}
