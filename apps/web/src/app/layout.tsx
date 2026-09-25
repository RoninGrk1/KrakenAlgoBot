import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KrakenAlgoBot",
  description: "Non-custodial. Automated. On-chain. BTC · ETH · SOL.",
  applicationName: "KrakenAlgoBot",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
