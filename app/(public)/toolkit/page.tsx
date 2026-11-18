import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Toolkit", description: "Platforms, charting, indicators and desk setup." };

export default function ToolkitPage() {
  return (
    <>
      <PageHeader eyebrow="What I use" title="Toolkit" description="Platforms, charting, indicators and desk setup." />
      <SectionPending what="Toolkit items" />
    </>
  );
}
