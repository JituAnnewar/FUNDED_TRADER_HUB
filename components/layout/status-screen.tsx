import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SITE } from "@/lib/site";

/** Full-screen themed message used by 404 and error pages. */
export function StatusScreen({
  code,
  title,
  body,
  children,
}: {
  code: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col px-4 sm:px-6">
      <div className="mx-auto flex h-[var(--nav-h)] w-full max-w-6xl items-center">
        <Link href="/" aria-label={`${SITE.brand} home`}>
          <Logo brand={SITE.brand} />
        </Link>
      </div>
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-16">
        <p className="num border-loss/30 bg-loss/10 text-loss mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="bg-loss size-1.5 rounded-full" aria-hidden="true" />
          {code}
        </p>
        <h1 className="text-4xl font-semibold sm:text-6xl">{title}</h1>
        <p className="text-muted mt-4 text-base leading-relaxed sm:text-lg">{body}</p>
        <div className="mt-10 flex flex-wrap gap-3">{children}</div>
      </main>
    </div>
  );
}
