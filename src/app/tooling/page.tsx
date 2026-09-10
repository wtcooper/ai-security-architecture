import { Suspense } from "react";
import { ToolingBrowser } from "@/components/tooling/ToolingBrowser";

export const metadata = { title: "AI Tooling · AI Risk Map" };

export default function ToolingPage() {
  return (
    <Suspense>
      <ToolingBrowser />
    </Suspense>
  );
}
