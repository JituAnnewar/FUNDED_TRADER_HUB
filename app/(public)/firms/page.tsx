import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Firms", description: "The prop firms I use, their rules and my honest review of each." };

export default function FirmsPage() {
  return (
    <>
      <PageHeader eyebrow="Where I trade" title="Firms" description="The prop firms I use, their rules and my honest review of each." />
      <SectionPending what="Firms" />
    </>
  );
}
