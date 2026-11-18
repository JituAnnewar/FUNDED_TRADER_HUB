"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SessionsPill } from "@/components/layout/sessions-pill";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/site";
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

function NavbarView({ brand, pathname }: { brand: string; pathname: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const moreActive = SECONDARY_NAV.some((i) => isActive(pathname, i.href));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[var(--nav-h)] border-b transition-[background,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-line bg-bg/70 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main"
        className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link href="/" aria-label={`${brand} home`} className="shrink-0 rounded-lg">
          <Logo brand={brand} />
        </Link>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm transition-colors",
                    active ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors data-[state=open]:text-fg",
                  moreActive ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                More <ChevronDown className="size-3.5" aria-hidden="true" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={10}
                  className="glass z-50 min-w-44 p-1.5"
                >
                  {SECONDARY_NAV.map((item) => (
                    <DropdownMenu.Item key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-fg",
                          isActive(pathname, item.href) ? "text-fg" : "text-muted",
                        )}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <SessionsPill className="hidden md:flex" />
          <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex lg:hidden xl:inline-flex">
            <Link href="/contact">Contact</Link>
          </Button>
          <MobileMenu brand={brand} pathname={pathname} />
        </div>
      </nav>
    </header>
  );
}
