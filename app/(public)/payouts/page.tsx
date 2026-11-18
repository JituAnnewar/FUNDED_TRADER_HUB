import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Payouts", description: "Every payout received from a prop firm, with certificates." };

export default function PayoutsPage() {
  return (
    <>
      <PageHeader eyebrow="Paid out" title="Payouts" description="Every payout received from a prop firm, with certificates." />
      <SectionPending what="Payouts" />
    </>
  );
}
