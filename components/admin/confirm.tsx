"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Button that asks for confirmation in a dialog before running `onConfirm`. */
export function ConfirmButton({
  title,
  body,
  confirmLabel = "Confirm",
  onConfirm,
  children,
  variant = "ghost",
  size = "sm",
  className,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" variant={variant} size={size} className={className ?? "text-loss hover:text-loss"}>
          {children}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-bg/80 backdrop-blur-sm" />
        <Dialog.Content className="glass fixed top-1/2 left-1/2 z-[81] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 p-6">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted">{body}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              size="sm"
              className="bg-loss text-white shadow-none hover:brightness-110"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                } finally {
                  setBusy(false);
                  setOpen(false);
                }
              }}
            >
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />} {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
