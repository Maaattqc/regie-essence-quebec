import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
  title: "Essence Québec | Carte des prix de l'essence et du carburant diesel",
  description:
    "Consultez la carte des prix de l'essence au Québec en temps réel. Trouvez les prix actuels, comparez les stations-service près de chez vous et économisez sur le carburant.",
  keywords: [
    "prix essence Québec",
    "carte essence Québec",
    "prix carburant Québec",
    "stations-service Québec",
    "essence pas cher Québec",
    "diesel Québec",
    "prix gaz Québec",
  ],
  metadataBase: new URL("https://essence-quebec.ca"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://essence-quebec.ca",
    title: "Essence Québec | Carte des prix de l'essence et du carburant diesel",
    description:
      "Consultez la carte des prix de l'essence au Québec en temps réel. Trouvez les prix actuels, comparez les stations-service près de chez vous et économisez sur le carburant.",
    locale: "fr_CA",
    siteName: "Essence Québec",
  },
  twitter: {
    card: "summary_large_image",
    title: "Essence Québec | Carte des prix de l'essence et du carburant diesel",
    description:
      "Consultez la carte des prix de l'essence au Québec en temps réel. Trouvez les prix actuels et comparez les stations-service près de chez vous.",
  },
  other: {
    "geo.region": "CA-QC",
    "geo.placename": "Québec",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr-CA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
