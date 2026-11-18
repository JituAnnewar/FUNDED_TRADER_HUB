import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Performance", description: "Net results, win rate, drawdown and every other number that matters, across all accounts." };

export default function PerformancePage() {
  return (
    <>
      <PageHeader eyebrow="Track record" title="Performance" description="Net results, win rate, drawdown and every other number that matters, across all accounts." />
      <SectionPending what="Performance statistics" />
    </>
  );
}
