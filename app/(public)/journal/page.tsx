import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Journal", description: "Every trade, with screenshots, notes and what I learned." };

export default function JournalPage() {
  return (
    <>
      <PageHeader eyebrow="Trade log" title="Journal" description="Every trade, with screenshots, notes and what I learned." />
      <SectionPending what="Trades" />
    </>
  );
}
