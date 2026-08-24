import type { Metadata } from "next";
import { Sora, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-head",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rentmanagement-liard.vercel.app/"), // ** swap for your real domain once deployed
  title: {
    default: "DomusPRO",
    template: "%s | DomusPRO",
  },
  description: "Manage properties, tenants, and rent payments in one place.",
  openGraph: {
    title: "DomusPRO",
    description: "Manage properties, tenants, and rent payments in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DomusPRO",
    description: "Manage properties, tenants, and rent payments in one place.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
