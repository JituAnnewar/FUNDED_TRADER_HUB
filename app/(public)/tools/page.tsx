import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Tools", description: "Position size, risk-reward, drawdown recovery and a prop challenge simulator." };

export default function ToolsPage() {
  return (
    <>
      <PageHeader eyebrow="Free calculators" title="Tools" description="Position size, risk-reward, drawdown recovery and a prop challenge simulator." />
      <SectionPending what="Calculators" />
    </>
  );
}
