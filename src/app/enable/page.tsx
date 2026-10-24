import { Suspense } from "react";
import { EnableRedirect } from "@/components/enable/EnableRedirect";

export const metadata = { title: "Enable · AI Security Architecture" };

export default function EnablePage() {
  return (
    <Suspense>
      <EnableRedirect />
    </Suspense>
  );
}
