import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What data this site collects and how it is used.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy" />
      <Prose>
        <p>
          This page explains what {SITE.brand} collects when you visit, and what happens to it. The short version:
          very little, and it is never sold.
        </p>

        <h2>Browsing the site</h2>
        <p>
          You can read every public page without an account. The site does not use advertising or tracking
          cookies. Your browser stores one small local setting so the intro animation only plays on your first
          visit.
        </p>

        <h2>Contact form</h2>
        <p>When you send a message through the <Link href="/contact">contact page</Link>, I store:</p>
        <ul>
          <li>your name, email address, subject, category and message, so I can reply;</li>
          <li>a one-way hash of your IP address and your browser&apos;s user agent, used only to stop spam.</li>
        </ul>
        <p>
          Messages are stored in the site&apos;s database (hosted by Supabase) and may be forwarded to my inbox by
          email (via Resend). Only I can read them. Ask me through the same form and I will delete your message.
        </p>

        <h2>Hosting</h2>
        <p>
          The site is hosted on Vercel. Like any web host, Vercel processes standard request logs (such as IP
          address and time of request) to deliver pages and protect against abuse.
        </p>

        <h2>Third-party widgets</h2>
        <p>
          If market widgets from TradingView are switched on, they load from TradingView&apos;s servers and are
          covered by TradingView&apos;s own privacy policy.
        </p>
      </Prose>
    </>
  );
}
