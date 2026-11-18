"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SessionsPill } from "@/components/layout/sessions-pill";
import { CONTACT_NAV, PRIMARY_NAV, SECONDARY_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navbar with active-link state. Needs <Suspense> on dynamic routes (usePathname). */
export function Navbar({ brand }: { brand: string }) {
  const pathname = usePathname();
  return <NavbarView brand={brand} pathname={pathname} />;
}

/** Same markup without the active state, used as the Suspense fallback. */
export function NavbarFallback({ brand }: { brand: string }) {
  return <NavbarView brand={brand} pathname="" />;
}

/** Floating glass bar: logo, five main links + "More", live sessions and one Contact button. */
function NavbarView({ brand, pathname }: { brand: string; pathname: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const moreActive = SECONDARY_NAV.some((i) => isActive(pathname, i.href));

  return (
    <header className="sticky top-0 z-50 h-[var(--nav-h)] px-3 pt-3 sm:px-5">
      <a
        href="#main"
        className="focus:bg-accent focus:text-bg sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl border pr-2 pl-4 transition-[background,border-color,box-shadow] duration-300",
          scrolled
            ? "border-line-strong bg-surface/75 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" aria-label={`${brand} home`} className="shrink-0 rounded-lg">
          <Logo brand={brand} />
        </Link>

        <ul className="border-line hidden items-center rounded-xl border bg-white/[0.02] p-1 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-violet/20 text-fg shadow-[inset_0_0_0_1px_rgb(165_148_255/0.35)]"
                      : "text-muted hover:text-fg hover:bg-white/[0.04]",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger
                className={cn(
                  "data-[state=open]:text-fg flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-sm transition-colors",
                  moreActive ? "bg-violet/20 text-fg" : "text-muted hover:text-fg hover:bg-white/[0.04]",
                )}
              >
                More <ChevronDown className="size-3.5" aria-hidden="true" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={12}
                  className="glass z-50 min-w-48 p-1.5 data-[state=open]:animate-[rise_0.25s_ease-out]"
                >
                  {SECONDARY_NAV.map((item) => (
                    <DropdownMenu.Item key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "data-[highlighted]:text-fg flex items-center justify-between rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/[0.06]",
                          isActive(pathname, item.href) ? "text-fg" : "text-muted",
                        )}
                      >
                        {item.label}
                        <ArrowUpRight className="size-3.5 opacity-40" aria-hidden="true" />
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <SessionsPill className="hidden xl:flex" />
          <Link
            href={CONTACT_NAV.href}
            className="hidden h-10 items-center gap-1.5 rounded-xl bg-[image:var(--grad-button)] px-4 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(124_92_255/0.9)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] sm:inline-flex"
            data-magnetic
          >
            {CONTACT_NAV.label}
          </Link>
          <MobileMenu brand={brand} pathname={pathname} />
        </div>
      </nav>
    </header>
  );
}
