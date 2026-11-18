import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SwRegister } from "@/components/admin/sw-register";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false, nocache: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Admin", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#05070A" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SwRegister />
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </>
  );
}
