"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Script from "next/script";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { sendContactMessage } from "@/app/(public)/contact/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CONTACT_CATEGORIES, contactSchema, type ContactInput } from "@/lib/validation/contact";

const field =
  "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus-visible:border-accent aria-[invalid=true]:border-loss";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

export function ContactForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { category: "general", website: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const token = (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value;
    const res = await sendContactMessage({ ...values, turnstileToken: token });
    if (res.ok) {
      setDone(true);
      reset();
      return;
    }
    setServerError(res.error);
    for (const [k, msg] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof ContactInput, { message: msg });
    window.turnstile?.reset();
  });

  return (
    <div className="relative">
      {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-12 text-center"
            role="status"
          >
            <motion.span initial={reduce ? false : { scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}>
              <CheckCircle2 className="size-14 text-profit drop-shadow-[0_0_16px_var(--c-profit)]" aria-hidden="true" />
            </motion.span>
            <h2 className="text-2xl font-semibold">Message sent</h2>
            <p className="max-w-sm text-sm text-muted">Thanks for reaching out. I read every message and reply to the ones I can help with.</p>
            <Button variant="secondary" size="sm" onClick={() => setDone(false)}>
              Send another
            </Button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} noValidate initial={false} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="mb-1.5 block text-sm">
                  Name
                </label>
                <input id="c-name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} {...register("name")} />
                {errors.name && <p id="c-name-err" className="mt-1 text-xs text-loss">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="c-email" className="mb-1.5 block text-sm">
                  Email
                </label>
                <input id="c-email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} {...register("email")} />
                {errors.email && <p id="c-email-err" className="mt-1 text-xs text-loss">{errors.email.message}</p>}
              </div>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm">Topic</legend>
              <div className="flex flex-wrap gap-2">
                {CONTACT_CATEGORIES.map((c) => (
                  <label key={c.value} className="cursor-pointer">
                    <input type="radio" value={c.value} className="peer sr-only" {...register("category")} />
                    <span className="block rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="c-subject" className="mb-1.5 block text-sm">
                Subject
              </label>
              <input id="c-subject" className={field} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "c-subject-err" : undefined} {...register("subject")} />
              {errors.subject && <p id="c-subject-err" className="mt-1 text-xs text-loss">{errors.subject.message}</p>}
            </div>
            <div>
              <label htmlFor="c-message" className="mb-1.5 block text-sm">
                Message
              </label>
              <textarea id="c-message" rows={6} className={cn(field, "resize-y")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-message-err" : undefined} {...register("message")} />
              {errors.message && <p id="c-message-err" className="mt-1 text-xs text-loss">{errors.message.message}</p>}
            </div>
            {/* Honeypot: hidden from people and screen readers */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="c-website">Website</label>
              <input id="c-website" tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>
            {turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" />}
            {serverError && (
              <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss" role="alert">
                {serverError}
              </p>
            )}
            <Button type="submit" size="lg" disabled={isSubmitting} data-magnetic>
              {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {isSubmitting ? "Sending…" : "Send message"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
