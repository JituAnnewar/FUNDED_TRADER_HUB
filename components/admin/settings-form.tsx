"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { FieldShell, inputCls, MarkdownInput, Toggle, UploadInput } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { saveSettings } from "@/lib/admin/site-actions";
import { SOCIAL_LABELS, type SocialId } from "@/lib/site";
import { browserClient } from "@/lib/supabase/browser";
import type { SiteSettings } from "@/lib/types";
import { SECTION_KEYS, settingsSchema, type SettingsInput } from "@/lib/validation/settings";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const socials = settings.socials;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema) as unknown as Resolver<SettingsInput>,
    defaultValues: {
      brand_name: settings.brand_name,
      trader_name: settings.trader_name,
      tagline: settings.tagline,
      hero_copy: settings.hero_copy ?? "",
      about_text: settings.about_text ?? "",
      avatar_url: settings.avatar_url ?? "",
      socials: { instagram: socials.instagram ?? "", x: socials.x ?? "", youtube: socials.youtube ?? "", telegram: socials.telegram ?? "", discord: socials.discord ?? "", whatsapp: socials.whatsapp ?? "" },
      sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, settings.sections[k] !== false])) as SettingsInput["sections"],
      show_open_positions_publicly: settings.show_open_positions_publicly,
      usd_to_inr_rate: settings.usd_to_inr_rate,
      disclaimer_text: settings.disclaimer_text ?? "",
      seo_title: settings.seo_title ?? "",
      seo_description: settings.seo_description ?? "",
      show_tradingview_widgets: settings.show_tradingview_widgets,
    },
  });

  const submit = handleSubmit((v) =>
    start(async () => {
      const res = await saveSettings(v);
      if (!res.ok) {
        toast.error(res.error);
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof SettingsInput, { message: m });
        return;
      }
      toast.success(res.message ?? "Saved.");
      router.refresh();
    }),
  );

  const err = (k: string) => k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], errors) as { message?: string } | undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-6 pb-28">
      <section className="glass grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="text-xs font-medium tracking-[0.16em] text-muted uppercase sm:col-span-2">Brand</h2>
        <FieldShell id="s-brand" label="Brand / site name" error={err("brand_name")?.message}>
          <input id="s-brand" className={inputCls} {...register("brand_name")} />
        </FieldShell>
        <FieldShell id="s-name" label="Your name" error={err("trader_name")?.message}>
          <input id="s-name" className={inputCls} {...register("trader_name")} />
        </FieldShell>
        <FieldShell id="s-tag" label="Tagline" error={err("tagline")?.message}>
          <input id="s-tag" className={inputCls} {...register("tagline")} />
        </FieldShell>
        <FieldShell id="s-inr" label="USD → INR rate (manual)" error={err("usd_to_inr_rate")?.message}>
          <input id="s-inr" inputMode="decimal" className={`${inputCls} num`} {...register("usd_to_inr_rate")} />
        </FieldShell>
        <FieldShell id="s-hero" label="Hero text (home page)" error={err("hero_copy")?.message} className="sm:col-span-2">
          <textarea id="s-hero" rows={2} className={`${inputCls} h-auto py-2.5`} {...register("hero_copy")} />
        </FieldShell>
        <FieldShell id="s-avatar" label="Photo (About page)" className="sm:col-span-2">
          <Controller control={control} name="avatar_url" render={({ field }) => <UploadInput id="s-avatar" bucket="site-media" value={(field.value as string) || null} onChange={(v) => field.onChange(v ?? "")} />} />
        </FieldShell>
        <FieldShell id="s-about" label="About text" className="sm:col-span-2">
          <Controller control={control} name="about_text" render={({ field }) => <MarkdownInput id="s-about" value={String(field.value ?? "")} onChange={field.onChange} />} />
        </FieldShell>
      </section>

      <section className="glass grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="text-xs font-medium tracking-[0.16em] text-muted uppercase sm:col-span-2">Social links (full URLs; blank hides)</h2>
        {(Object.keys(SOCIAL_LABELS) as SocialId[]).map((k) => (
          <FieldShell key={k} id={`s-${k}`} label={SOCIAL_LABELS[k]} error={err(`socials.${k}`)?.message}>
            <input id={`s-${k}`} type="url" placeholder={k === "whatsapp" ? "https://wa.me/91..." : "https://"} className={inputCls} {...register(`socials.${k}`)} />
          </FieldShell>
        ))}
      </section>

      <section className="glass grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="text-xs font-medium tracking-[0.16em] text-muted uppercase sm:col-span-2">What is public</h2>
        {SECTION_KEYS.map((k) => (
          <Controller key={k} control={control} name={`sections.${k}`} render={({ field }) => <Toggle id={`sec-${k}`} checked={Boolean(field.value)} onChange={field.onChange} label={`Show ${k} on the home page`} />} />
        ))}
        <Controller control={control} name="show_open_positions_publicly" render={({ field }) => <Toggle id="s-open" checked={Boolean(field.value)} onChange={field.onChange} label="Show open positions publicly" />} />
        <Controller control={control} name="show_tradingview_widgets" render={({ field }) => <Toggle id="s-tv" checked={Boolean(field.value)} onChange={field.onChange} label="Show TradingView price ticker on home" />} />
      </section>

      <section className="glass grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="text-xs font-medium tracking-[0.16em] text-muted uppercase sm:col-span-2">Search engines</h2>
        <FieldShell id="s-seot" label="Default page title" error={err("seo_title")?.message}>
          <input id="s-seot" className={inputCls} {...register("seo_title")} />
        </FieldShell>
        <FieldShell id="s-seod" label="Default description" error={err("seo_description")?.message}>
          <input id="s-seod" className={inputCls} {...register("seo_description")} />
        </FieldShell>
        <FieldShell id="s-disc" label="Extra disclaimer text (shown on the Disclaimer page)" className="sm:col-span-2">
          <textarea id="s-disc" rows={3} className={`${inputCls} h-auto py-2.5`} {...register("disclaimer_text")} />
        </FieldShell>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-4xl justify-end px-4 py-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Save settings
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Enrol / remove a TOTP authenticator (Supabase MFA). */
export function MfaSetup() {
  const [factors, setFactors] = useState<{ id: string; status: string; friendly_name?: string }[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const sb = browserClient();
    if (!sb) return;
    const { data } = await sb.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);

  async function start() {
    const sb = browserClient();
    if (!sb) return;
    setBusy(true);
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Admin ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (error || !data) return void toast.error(error?.message ?? "Could not start setup.");
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify() {
    const sb = browserClient();
    if (!sb || !enroll) return;
    setBusy(true);
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
    setBusy(false);
    if (error) return void toast.error("That code did not work. Try the next one.");
    toast.success("Two-factor sign-in is on.");
    setEnroll(null);
    setCode("");
    void load();
  }

  async function remove(id: string) {
    const sb = browserClient();
    if (!sb) return;
    const { error } = await sb.auth.mfa.unenroll({ factorId: id });
    if (error) return void toast.error(error.message);
    toast.success("Authenticator removed.");
    void load();
  }

  const verified = factors?.filter((f) => f.status === "verified") ?? [];
  return (
    <section className="glass mt-6 p-4 sm:p-6">
      <h2 className="mb-2 flex items-center gap-2 font-semibold">
        <ShieldCheck className="size-4 text-profit" aria-hidden="true" /> Two-factor sign-in
      </h2>
      {factors === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : verified.length ? (
        <div className="space-y-2 text-sm">
          <p className="text-profit">On. You will be asked for a 6-digit code after your password.</p>
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
              <span>{f.friendly_name ?? "Authenticator app"}</span>
              <button type="button" onClick={() => void remove(f.id)} className="text-xs text-loss hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : enroll ? (
        <div className="space-y-3 text-sm">
          <p>Scan this with Google Authenticator, 1Password, Authy or similar, then enter the code it shows.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL from Supabase */}
          <img src={enroll.qr} alt="QR code for your authenticator app" className="size-44 rounded-xl bg-white p-2" />
          <p className="text-xs text-muted">
            Can&apos;t scan? Enter this key: <span className="num text-fg">{enroll.secret}</span>
          </p>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" className={`${inputCls} num max-w-40 text-center tracking-[0.3em]`} aria-label="6-digit code" />
            <Button type="button" onClick={() => void verify()} disabled={busy || code.length < 6}>
              Verify
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted">Off. Turn it on so a stolen password is not enough to get in.</p>
          <Button type="button" variant="secondary" onClick={() => void start()} disabled={busy}>
            Set up authenticator
          </Button>
        </div>
      )}
    </section>
  );
}
