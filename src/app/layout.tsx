import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import CookieConsent from "@/components/CookieConsent";
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
  title: {
    default: "Carte des prix d'Essence Québec",
    template: "%s | Essence Québec",
  },
  description:
    "Consultez les prix de l'essence au Québec en temps réel. Comparez les stations-service près de chez vous et économisez sur le carburant.",
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
    title: "Carte des prix d'Essence Québec",
    description:
      "Consultez les prix de l'essence au Québec en temps réel. Comparez les stations-service près de chez vous et économisez sur le carburant.",
    locale: "fr_CA",
    siteName: "Essence Québec",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carte des prix d'Essence Québec",
    description:
      "Consultez les prix de l'essence au Québec en temps réel. Comparez les stations-service près de chez vous et économisez.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://essence-quebec.ca/#website",
                  url: "https://essence-quebec.ca",
                  name: "Essence Québec",
                  description:
                    "Carte interactive des prix de l'essence au Québec en temps réel.",
                  inLanguage: "fr-CA",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://essence-quebec.ca/?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://essence-quebec.ca/#app",
                  name: "Essence Québec",
                  url: "https://essence-quebec.ca",
                  description:
                    "Consultez et comparez les prix de l'essence et du diesel dans toutes les régions du Québec grâce à notre carte interactive.",
                  applicationCategory: "UtilityApplication",
                  operatingSystem: "Web",
                  isAccessibleForFree: true,
                  inLanguage: "fr-CA",
                  areaServed: {
                    "@type": "AdministrativeArea",
                    name: "Québec",
                    containedInPlace: { "@type": "Country", name: "Canada" },
                  },
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "CAD",
                  },
                },
              ],
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
