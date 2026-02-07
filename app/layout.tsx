import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';
import SpotlightSearch from '@/components/SpotlightSearch';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gospel Lyrics — Chaque parole transforme une vie",
  description: "Découvrez la nouvelle génération d'artistes gospel. Paroles synchronisées, messages impactants et louange moderne.",
  metadataBase: new URL("https://gospel-lyrics.app"),
  openGraph: {
    title: "Gospel Lyrics — Chaque parole transforme une vie",
    description: "Paroles synchronisées, messages impactants et louange moderne.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#6c5ce7" />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[--accent] focus:text-white focus:rounded-lg">
          Aller au contenu principal
        </a>
        <Header />
        <SpotlightSearch />
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
