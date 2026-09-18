import { Suspense } from "react";
import { CapabilitiesRoute } from "@/components/capabilities/CapabilitiesBrowser";

export const metadata = { title: "Technology capabilities · AI Risk Map" };

export default function CapabilitiesPage() {
  return <Suspense><CapabilitiesRoute /></Suspense>;
}
