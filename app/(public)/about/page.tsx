import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "About", description: "How I got here, milestones so far and what I am working towards." };

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About me" title="About" description="How I got here, milestones so far and what I am working towards." />
      <SectionPending what="My story and milestones" />
    </>
  );
}
