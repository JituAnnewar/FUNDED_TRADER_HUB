import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Insights", description: "Lessons and market notes." };

export default function InsightsPage() {
  return (
    <>
      <PageHeader eyebrow="Notes" title="Insights" description="Lessons and market notes." />
      <SectionPending what="Posts" />
    </>
  );
}
