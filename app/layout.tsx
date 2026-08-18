import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rentmanagement-liard.vercel.app/"), // TODO: swap for your real domain once deployed
  title: {
    default: "Rent Manager",
    template: "%s | Rent Manager",
  },
  description: "Manage properties, tenants, and rent payments in one place.",
  openGraph: {
    title: "Rent Manager",
    description: "Manage properties, tenants, and rent payments in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rent Manager",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
