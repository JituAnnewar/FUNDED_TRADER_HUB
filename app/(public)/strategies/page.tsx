import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Strategies", description: "The setups I trade, the rules I follow and how each one performs." };

export default function StrategiesPage() {
  return (
    <>
      <PageHeader eyebrow="Playbook" title="Strategies" description="The setups I trade, the rules I follow and how each one performs." />
      <SectionPending what="Strategies" />
    </>
  );
}
