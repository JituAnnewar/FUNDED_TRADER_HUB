"use client";

import { Check, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Native share sheet where available, otherwise copies the link. Optional branded image download. */
export function ShareButton({ title, path, imagePath }: { title: string; path: string; imagePath?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={share}>
        {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        {copied ? "Link copied" : "Share"}
      </Button>
      {imagePath && (
        <Button asChild variant="secondary" size="sm">
          <a href={imagePath} download>
            <Download aria-hidden="true" /> Share image
          </a>
        </Button>
      )}
    </div>
  );
}
