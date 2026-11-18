import { ImageResponse } from "next/og";
import { MarkImage } from "@/lib/og/mark";

export function GET() {
  return new ImageResponse(<MarkImage size={512} />, { width: 512, height: 512 });
}
