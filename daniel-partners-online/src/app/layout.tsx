import type { Metadata } from "next";
import { Cormorant_Garamond, Josefin_Sans, Source_Sans_3 } from "next/font/google";
import { firm } from "@/lib/brand";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: firm.productName,
    template: `%s · ${firm.productName}`,
  },
  description: `${firm.name} — the same lawyers, now online. Flat-fee wills, real estate, incorporation, employment advice and notary services delivered by secure video from St. Catharines, Ontario.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${cormorant.variable} ${josefin.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
