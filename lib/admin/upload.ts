"use client";

import { browserClient } from "@/lib/supabase/browser";

export type Bucket = "certificates" | "trade-screenshots" | "firm-logos" | "site-media";

const MAX = 2000;

async function canvasToWebp(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image."))), "image/webp", quality));
}

/** Resize to at most 2000 px on the long edge and re-encode as WebP. SVGs are uploaded as-is. */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasToWebp(canvas);
}

/** Render page 1 of a PDF to a WebP thumbnail (max 1200 px wide). */
export async function pdfThumbnail(file: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(2, 1200 / base.width) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, viewport }).promise;
  const blob = await canvasToWebp(canvas, 0.82);
  await task.destroy();
  return blob;
}

function key(ext: string): string {
  const d = new Date();
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadBlob(bucket: Bucket, blob: Blob, ext: string): Promise<string> {
  const sb = browserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  const path = key(ext);
  const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: blob.type || undefined, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Upload an image (compressed) or PDF (with thumbnail). Returns public URLs. */
export async function uploadFile(bucket: Bucket, file: File): Promise<{ url: string; thumbUrl: string | null }> {
  if (file.size > 25 * 1024 * 1024) throw new Error("That file is over 25 MB.");
  if (file.type === "application/pdf") {
    const url = await uploadBlob(bucket, file, "pdf");
    let thumbUrl: string | null = null;
    try {
      thumbUrl = await uploadBlob(bucket, await pdfThumbnail(file), "webp");
    } catch {
      thumbUrl = null;
    }
    return { url, thumbUrl };
  }
  if (!file.type.startsWith("image/")) throw new Error("Only images and PDFs can be uploaded.");
  const blob = await compressImage(file);
  const url = await uploadBlob(bucket, blob, file.type === "image/svg+xml" ? "svg" : "webp");
  return { url, thumbUrl: null };
}
