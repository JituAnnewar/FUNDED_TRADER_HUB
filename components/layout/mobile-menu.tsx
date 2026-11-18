"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { SessionsPill } from "@/components/layout/sessions-pill";
import { LEGAL_NAV, PRIMARY_NAV, SECONDARY_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

const ITEMS = [...PRIMARY_NAV, ...SECONDARY_NAV];

/** Full-screen animated menu for phones and tablets. CSS animations only (see .menu-* in globals.css). */
export function MobileMenu({ brand, pathname }: { brand: string; pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="grid size-10 place-items-center rounded-xl border border-line bg-white/[0.03] text-fg lg:hidden" aria-label="Open menu">
        <Menu className="size-5" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="menu-overlay fixed inset-0 z-[70] bg-bg/95 backdrop-blur-xl" />
        <Dialog.Content className="menu-overlay fixed inset-0 z-[71] flex flex-col overflow-y-auto px-4 pb-8 sm:px-6" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Site menu</Dialog.Title>
          <div className="flex h-[var(--nav-h)] shrink-0 items-center justify-between">
            <Link href="/" onClick={() => setOpen(false)} aria-label={`${brand} home`}>
              <Logo brand={brand} />
            </Link>
            <Dialog.Close className="grid size-10 place-items-center rounded-xl border border-line bg-white/[0.03]" aria-label="Close menu">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <nav aria-label="Mobile" className="mt-6 flex-1">
            <ul className="flex flex-col">
              {ITEMS.map((item, i) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href} className="menu-item" style={{ ["--i" as string]: i }}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex items-baseline justify-between border-b border-line py-3.5 font-display text-2xl tracking-tight", active ? "text-fg" : "text-muted")}
                    >
                      {item.label}
                      <span className="num text-xs text-muted/50">{String(i + 1).padStart(2, "0")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-8 flex flex-col gap-4">
            <SessionsPill className="self-start" />
            <div className="flex gap-4 text-sm text-muted">
              {LEGAL_NAV.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="hover:text-fg">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
