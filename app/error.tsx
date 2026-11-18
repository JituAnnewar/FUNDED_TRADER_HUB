"use client";

import Link from "next/link";
import { StatusScreen } from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusScreen
      code={error.digest ? `ERROR · ${error.digest}` : "ERROR"}
      title="Something went wrong"
      body="This page hit an unexpected error. Try again, and if it keeps happening, come back in a few minutes."
    >
      <Button onClick={reset}>Try again</Button>
      <Button asChild variant="secondary">
        <Link href="/">Back to home</Link>
      </Button>
    </StatusScreen>
  );
}
