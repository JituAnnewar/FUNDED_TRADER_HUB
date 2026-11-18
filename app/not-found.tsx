import type { Metadata } from "next";
import Link from "next/link";
import { StatusScreen } from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <StatusScreen
      code="404 · STOP LOSS HIT"
      title="Stopped out: this page doesn't exist"
      body="The link may be old, or the page was moved. Nothing was lost except a click."
    >
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/performance">See performance</Link>
      </Button>
    </StatusScreen>
  );
}
