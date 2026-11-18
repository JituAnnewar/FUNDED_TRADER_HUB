import { z } from "zod";

export const CONTACT_CATEGORIES = [
  { value: "mentorship", label: "Mentorship" },
  { value: "collaboration", label: "Collaboration" },
  { value: "business", label: "Business" },
  { value: "general", label: "General" },
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120, "That name is too long."),
  email: z.email("Please enter a valid email address.").max(254),
  category: z.enum(["mentorship", "collaboration", "business", "general"]),
  subject: z.string().trim().min(3, "Please add a short subject.").max(200, "Keep the subject under 200 characters."),
  message: z.string().trim().min(10, "Please write at least a sentence.").max(5000, "Keep the message under 5,000 characters."),
  /** Honeypot: must stay empty. */
  website: z.string().max(0).optional().or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof ContactInput, string>> };
