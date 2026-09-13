import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar, MobileBar } from "@/components/sidebar";
import { ScanTopBar } from "@/components/scan-topbar";

const sans = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const condensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-condensed",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title:       { default: "Gogrou", template: "%s · Gogrou" },
  description: "B2B platforma pro výrobní firmy — GPC katalog + GSS provoz.",
  icons:       { icon: "/icon.svg", apple: "/icon.svg" },
  manifest:    "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    // Sladěno s --background tokeny v globals.css (oklch → sRGB aproximace)
    { media: "(prefers-color-scheme: light)", color: "#f2f2f3" },
    { media: "(prefers-color-scheme: dark)",  color: "#1d1f20" },
  ],
};

/** Které routes nemají sidebar (operátorský/onboarding kontext). */
function pickShell(pathname: string): "sidebar" | "scan" | "bare" {
  if (pathname.startsWith("/login")
   || pathname.startsWith("/signup")
   || pathname.startsWith("/forgot-password")
   || pathname.startsWith("/update-password")
   || pathname.startsWith("/auth/")) return "bare";
  if (pathname === "/gss/scan" || pathname.startsWith("/gss/scan/")) return "scan";
  return "sidebar";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const shell    = pickShell(pathname);

  return (
    <html
      lang="cs"
      suppressHydrationWarning
      className={`${sans.variable} ${condensed.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          {shell === "sidebar" && (
            <div className="flex min-h-screen">
              <Sidebar currentPath={pathname} />
              <div className="flex-1 flex flex-col min-w-0">
                <MobileBar />
                <main className="flex-1">{children}</main>
              </div>
            </div>
          )}
          {shell === "scan" && (
            <div className="min-h-screen flex flex-col">
              <ScanTopBar />
              <main className="flex-1">{children}</main>
            </div>
          )}
          {shell === "bare" && <main className="min-h-screen">{children}</main>}
        </Providers>
      </body>
    </html>
  );
}
