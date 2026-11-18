"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/app/admin/login/actions";
import { ADMIN_NAV } from "@/lib/admin/resources";
import { cn } from "@/lib/utils";

const GROUPS = [...new Set(ADMIN_NAV.map((n) => n.group))];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavListView pathname="" onNavigate={onNavigate} />}>
      <ActiveNavList onNavigate={onNavigate} />
    </Suspense>
  );
}

function ActiveNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavListView pathname={pathname} onNavigate={onNavigate} />;
}

function NavListView({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-3 text-[10px] font-medium tracking-[0.2em] text-muted/70 uppercase">{g}</p>
          <ul className="space-y-0.5">
            {ADMIN_NAV.filter((n) => n.group === g).map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname === n.href || pathname.startsWith(`${n.href}/`);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn("block rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-accent/10 text-accent" : "text-muted hover:bg-white/[0.04] hover:text-fg")}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const actions = [
    { label: "New trade (quick add)", href: "/admin/trades/quick" },
    { label: "New trade (full form)", href: "/admin/r/trades/new" },
    { label: "New payout", href: "/admin/r/payouts/new" },
    { label: "End-of-day update", href: "/admin/eod" },
    { label: "New journal entry", href: "/admin/r/journal/new" },
    { label: "New account", href: "/admin/r/accounts/new" },
    { label: "Import CSV", href: "/admin/import" },
    { label: "View public site", href: "/" },
  ];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-bg/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[12vh] left-1/2 z-[81] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command className="glass overflow-hidden" loop>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="size-4 text-muted" aria-hidden="true" />
              <Command.Input autoFocus placeholder="Type a command or page…" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted">No matches.</Command.Empty>
              <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase">
                {actions.map((a) => (
                  <Command.Item key={a.href} onSelect={() => go(a.href)} className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent">
                    {a.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase">
                {ADMIN_NAV.map((n) => (
                  <Command.Item key={n.href} onSelect={() => go(n.href)} className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent">
                    {n.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Signs out after the configured idle time in this tab (the proxy enforces it server-side too). */
function useIdleSignOut(minutes: number) {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await signOut();
        router.replace("/admin/login?reason=idle");
      }, minutes * 60_000);
    };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutes, router]);
}

export function AdminShell({ brand, idleMinutes, children }: { brand: string; idleMinutes: number; children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const router = useRouter();
  useIdleSignOut(idleMinutes);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const out = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin">
            <Logo brand={brand} />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <button type="button" onClick={() => setPalette(true)} className="mb-5 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-fg">
            <Search className="size-4" aria-hidden="true" /> Search
            <kbd className="ml-auto rounded border border-line px-1.5 text-[10px]">Ctrl K</kbd>
          </button>
          <NavList />
        </div>
        <div className="border-t border-line p-3">
          <button type="button" onClick={out} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/[0.04] hover:text-fg">
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/admin">
          <Logo brand={brand} />
        </Link>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPalette(true)} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="Search">
            <Search className="size-4" aria-hidden="true" />
          </button>
          <Dialog.Root open={menu} onOpenChange={setMenu}>
            <Dialog.Trigger className="grid size-10 place-items-center rounded-xl border border-line" aria-label="Open admin menu">
              <Menu className="size-5" aria-hidden="true" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-bg/80 backdrop-blur-sm" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-[71] flex w-72 max-w-[85vw] flex-col border-l border-line bg-surface" aria-describedby={undefined}>
                <div className="flex h-14 items-center justify-between px-4">
                  <Dialog.Title className="text-sm font-medium">Menu</Dialog.Title>
                  <Dialog.Close className="grid size-10 place-items-center rounded-xl border border-line" aria-label="Close menu">
                    <X className="size-4" aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-6">
                  <NavList onNavigate={() => setMenu(false)} />
                </div>
                <div className="border-t border-line p-3">
                  <button type="button" onClick={out} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted">
                    <LogOut className="size-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <main id="main" className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
      <CommandPalette open={palette} setOpen={setPalette} />
    </div>
  );
}
