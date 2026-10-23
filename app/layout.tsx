import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// One font for headings and body text across the landlord, tenant and marketing pages.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
  icons: {
    icon: "/app-logo-symbol.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
