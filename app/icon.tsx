import { ImageResponse } from "next/og";
import { MarkImage } from "@/lib/og/mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<MarkImage size={32} />, size);
}
