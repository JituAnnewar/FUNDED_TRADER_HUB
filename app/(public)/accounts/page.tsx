import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Accounts", description: "Every challenge and funded account, with balance, rules and distance to breach." };

export default function AccountsPage() {
  return (
    <>
      <PageHeader eyebrow="Prop firm accounts" title="Accounts" description="Every challenge and funded account, with balance, rules and distance to breach." />
      <SectionPending what="Accounts" />
    </>
  );
}
