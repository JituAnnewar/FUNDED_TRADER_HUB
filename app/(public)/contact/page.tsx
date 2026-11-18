import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPending } from "@/components/layout/section-pending";

export const metadata: Metadata = { title: "Contact", description: "Mentorship, collaboration or business enquiries." };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Contact" description="Mentorship, collaboration or business enquiries." />
      <SectionPending what="The contact form" />
    </>
  );
}
