import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === "production"
      ? "https://plotpin.net"
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PlotPin: Find verified rentals on the map",
    template: "%s · PlotPin",
  },
  description:
    "Map-first rental discovery. Browse approximate pins for free, unlock landlord contact when you are ready.",
  applicationName: "PlotPin",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "PlotPin: Find verified rentals on the map",
    description:
      "Browse rentals on the map. Pay once to unlock the landlord.",
    siteName: "PlotPin",
    url: siteUrl,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlotPin: Find verified rentals on the map",
    description:
      "Browse rentals on the map. Pay once to unlock the landlord.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialCountryCode =
    cookieStore.get("plotpin-country-hint")?.value ?? null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <AppProviders initialCountryCode={initialCountryCode}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
