import { ImageResponse } from "next/og";
import { MarkImage } from "@/lib/og/mark";

export function GET() {
  return new ImageResponse(<MarkImage size={192} />, { width: 192, height: 192 });
}
