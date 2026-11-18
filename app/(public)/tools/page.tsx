import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ToolsPanel } from "@/components/tools/tools-panel";

export const metadata: Metadata = {
  title: "Tools",
  description: "Free calculators: position size, risk-reward, drawdown recovery, prop challenge planner and a Monte Carlo challenge simulator.",
};

export default function ToolsPage() {
  return (
    <>
      <PageHeader eyebrow="Free calculators" title="Tools" description="The calculators I use before every challenge. Everything runs in your browser; nothing is saved." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ToolsPanel />
      </div>
    </>
  );
}
