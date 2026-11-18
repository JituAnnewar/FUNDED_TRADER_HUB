"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { ChecklistInput, FieldShell, inputCls, MarkdownInput, TagsInput, Toggle, UploadInput } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/confirm";
import { Button } from "@/components/ui/button";
import { deleteRecord, duplicateRecord, saveRecord } from "@/lib/admin/actions";
import { RESOURCES, resourceSchema, slugify, type Field } from "@/lib/admin/resources";
import { isoToIstLocal, istLocalToIso, todayIst } from "@/lib/time-input";

export interface RelationOption {
  value: string;
  label: string;
  extra?: Record<string, unknown>;
}

type Values = Record<string, unknown>;

function initialValue(f: Field, row: Values | null): unknown {
  const v = row?.[f.key];
  if (f.type === "datetime") return row ? isoToIstLocal(v as string | null) : f.required ? isoToIstLocal(new Date().toISOString()) : "";
  if (f.type === "date") return (v as string | null) ?? (f.required && !row ? todayIst() : "");
  if (f.type === "tags") return (v as string[] | null) ?? [];
  if (f.type === "checklist") return (v as { text: string }[] | null) ?? [];
  if (f.type === "boolean") return row ? Boolean(v) : Boolean(f.defaultValue);
  if (f.type === "markdown" && !row && f.template) return f.template;
  if (v === null || v === undefined) return row ? "" : (f.defaultValue ?? "");
  return v;
}

/** Generic create/edit form for any admin resource. */
export function RecordForm({
  resourceKey,
  row,
  relations,
  children,
}: {
  resourceKey: string;
  row: Values | null;
  relations: Partial<Record<"firms" | "accounts" | "strategies", RelationOption[]>>;
  children?: React.ReactNode;
}) {
  const r = RESOURCES[resourceKey]!;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(row));
  const schema = useMemo(() => resourceSchema(r), [r]);
  const defaults = useMemo(() => {
    const d: Values = {};
    for (const f of r.fields) {
      d[f.key] = initialValue(f, row);
      if (f.thumbKey) d[f.thumbKey] = (row?.[f.thumbKey] as string | null) ?? "";
    }
    return d;
  }, [r, row]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<Values>({ defaultValues: defaults, resolver: zodResolver(schema) as unknown as Resolver<Values> });

  const firmId = useWatch({ control, name: "firm_id" }) as string | undefined;
  const firm = relations.firms?.find((f) => f.value === firmId)?.extra;
  const groups = [...new Set(r.fields.map((f) => f.group ?? ""))];

  const submit = handleSubmit((values) => {
    const out: Values = { ...values };
    for (const f of r.fields) if (f.type === "datetime") out[f.key] = istLocalToIso(values[f.key] as string);
    start(async () => {
      const res = await saveRecord(r.key, (row?.id as string | undefined) ?? null, out);
      if (!res.ok) {
        toast.error(res.error);
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) setError(k, { message: m });
        return;
      }
      toast.success(res.message ?? "Saved.");
      if (!row && res.data) router.replace(`/admin/r/${r.key}/${res.data.id}`);
      router.refresh();
    });
  });

  function renderField(f: Field) {
    const id = `f-${f.key}`;
    const err = errors[f.key]?.message as string | undefined;
    const hint = f.firmRuleHint && firm ? `Firm rule: ${String(firm[f.firmRuleHint] ?? "none")}` : f.help;
    const common = { "aria-invalid": Boolean(err), "aria-describedby": err ? `${id}-err` : undefined };
    switch (f.type) {
      case "boolean":
        return (
          <Controller key={f.key} control={control} name={f.key} render={({ field }) => <Toggle id={id} checked={Boolean(field.value)} onChange={field.onChange} label={f.label} />} />
        );
      case "textarea":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err} className="sm:col-span-2">
            <textarea id={id} rows={3} className={`${inputCls} h-auto py-2.5`} {...common} {...register(f.key)} />
          </FieldShell>
        );
      case "markdown":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err} className="sm:col-span-2">
            <Controller control={control} name={f.key} render={({ field }) => <MarkdownInput id={id} value={String(field.value ?? "")} onChange={field.onChange} invalid={Boolean(err)} />} />
          </FieldShell>
        );
      case "tags":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err}>
            <Controller control={control} name={f.key} render={({ field }) => <TagsInput id={id} value={(field.value as string[]) ?? []} onChange={field.onChange} />} />
          </FieldShell>
        );
      case "checklist":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err} className="sm:col-span-2">
            <Controller control={control} name={f.key} render={({ field }) => <ChecklistInput value={(field.value as { text: string }[]) ?? []} onChange={field.onChange} />} />
          </FieldShell>
        );
      case "image":
      case "file":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err} className="sm:col-span-2">
            <Controller
              control={control}
              name={f.key}
              render={({ field }) => (
                <UploadInput
                  id={id}
                  bucket={f.bucket!}
                  value={(field.value as string) || null}
                  onChange={(v) => field.onChange(v ?? "")}
                  accept={f.type === "file" ? "image/*,application/pdf" : "image/*"}
                  onThumb={f.thumbKey ? (t) => setValue(f.thumbKey!, t ?? "", { shouldDirty: true }) : undefined}
                />
              )}
            />
          </FieldShell>
        );
      case "select":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err}>
            <select id={id} className={inputCls} {...common} {...register(f.key)}>
              {!f.required && <option value="">{f.firmRuleHint ? "Use firm rule" : "—"}</option>}
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldShell>
        );
      case "relation":
        return (
          <FieldShell key={f.key} id={id} label={f.label} help={hint} error={err}>
            <select id={id} className={inputCls} {...common} {...register(f.key)}>
              <option value="">{f.required ? "Choose…" : "None"}</option>
              {(relations[f.relation!] ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldShell>
        );
      default: {
        const type = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "url" ? "url" : "text";
        const reg = register(f.key, {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const target = r.fields.find((x) => x.slugFrom === f.key);
            if (target && !slugTouched) setValue(target.key, slugify(e.target.value), { shouldValidate: false });
            if (f.slugFrom) setSlugTouched(true);
          },
        });
        return (
          <FieldShell key={f.key} id={id} label={f.label + (f.type === "datetime" ? " (IST)" : "")} help={hint} error={err}>
            <input
              id={id}
              type={type}
              inputMode={f.type === "number" ? "decimal" : undefined}
              step={f.step}
              min={f.min}
              max={f.max}
              maxLength={f.maxLength}
              placeholder={f.firmRuleHint && firm ? String(firm[f.firmRuleHint] ?? "") : undefined}
              className={`${inputCls} ${f.type === "number" ? "num" : ""}`}
              {...common}
              {...reg}
            />
          </FieldShell>
        );
      }
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6 pb-28">
      {groups.map((g) => (
        <section key={g || "main"} className="glass p-4 sm:p-6">
          {g && <h2 className="mb-4 text-xs font-medium tracking-[0.16em] text-muted uppercase">{g}</h2>}
          <div className="grid gap-4 sm:grid-cols-2">{r.fields.filter((f) => (f.group ?? "") === g).map(renderField)}</div>
        </section>
      ))}
      {children}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex gap-2">
            {row && (
              <>
                <ConfirmButton
                  title={`Delete this ${r.singular}?`}
                  body="This cannot be undone."
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    const res = await deleteRecord(r.key, row.id as string);
                    if (!res.ok) {
                      toast.error(res.error);
                      return;
                    }
                    toast.success("Deleted.");
                    router.replace(`/admin/r/${r.key}`);
                  }}
                >
                  <Trash2 aria-hidden="true" /> <span className="hidden sm:inline">Delete</span>
                </ConfirmButton>
                {r.key !== "journal" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      start(async () => {
                        const res = await duplicateRecord(r.key, row.id as string);
                        if (!res.ok || !res.data) {
              toast.error(res.ok ? "Could not duplicate." : res.error);
              return;
            }
                        toast.success("Duplicated. You are now editing the copy.");
                        router.push(`/admin/r/${r.key}/${res.data.id}`);
                      })
                    }
                  >
                    <Copy aria-hidden="true" /> <span className="hidden sm:inline">Duplicate</span>
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDirty && <span className="hidden text-xs text-amber sm:inline">Unsaved changes</span>}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Save
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
