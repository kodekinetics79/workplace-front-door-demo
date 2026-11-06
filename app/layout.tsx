import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: { default: "The WorkPlace front door (demo)", template: "%s | The WorkPlace (demo)" },
  description: "Demonstration built by Kode Kinetics for The WorkPlace Mobile App RFP. Sample data only.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "WorkPlace", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#12304A", width: "device-width", initialScale: 1, viewportFit: "cover" };

// Applies saved display settings before first paint, so there is no flash of the wrong size or contrast.
const prefsScript = `try{var d=document.documentElement,s=localStorage.getItem('wp_text'),c=localStorage.getItem('wp_contrast');if(s)d.dataset.text=s;if(c)d.dataset.contrast=c}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout applies to every page */}
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
