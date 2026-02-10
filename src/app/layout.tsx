import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewFunnel - Collectez des avis intelligemment",
  description: "Système de QR codes intelligent pour collecter les avis clients et améliorer votre réputation en ligne.",
  keywords: ["avis", "restaurant", "QR code", "Google Reviews", "TripAdvisor", "review funnel"],
  authors: [{ name: "ReviewFunnel" }],
  openGraph: {
    title: "ReviewFunnel",
    description: "Collectez des avis intelligemment",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8B7355",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
