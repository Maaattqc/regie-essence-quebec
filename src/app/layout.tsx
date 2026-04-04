import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import PageTracker from "@/components/PageTracker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Essence Québec — Prix de l'essence et du diesel en direct",
    template: "%s | Essence Québec",
  },
  description:
    "Comparez l'essence et le diesel dans 2 500 stations-service au Québec. Carte interactive mise à jour plusieurs fois par jour avec données officielles.",
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
    title: "Essence Québec — Prix de l'essence et du diesel en direct",
    description:
      "Comparez l'essence et le diesel dans 2 500 stations-service au Québec. Carte interactive mise à jour plusieurs fois par jour avec données officielles.",
    locale: "fr_CA",
    siteName: "Essence Québec",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Essence Québec — logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Essence Québec — Prix de l'essence et du diesel en direct",
    description:
      "Comparez l'essence et le diesel dans 2 500 stations-service au Québec. Carte interactive mise à jour plusieurs fois par jour avec données officielles.",
    images: ["/android-chrome-512x512.png"],
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
                  "@type": "Organization",
                  "@id": "https://essence-quebec.ca/#organization",
                  name: "Essence Québec",
                  url: "https://essence-quebec.ca",
                  logo: "https://essence-quebec.ca/android-chrome-512x512.png",
                  description:
                    "Carte interactive des prix de l'essence au Québec en temps réel.",
                  founder: {
                    "@type": "Person",
                    name: "Mathieu Fournier",
                    sameAs: "https://www.linkedin.com/in/mathieu-fournier-4977591bb",
                  },
                  sameAs: [
                    "https://www.linkedin.com/in/mathieu-fournier-4977591bb",
                  ],
                  areaServed: {
                    "@type": "AdministrativeArea",
                    name: "Québec",
                    containedInPlace: { "@type": "Country", name: "Canada" },
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://essence-quebec.ca/#website",
                  url: "https://essence-quebec.ca",
                  name: "Essence Québec",
                  publisher: { "@id": "https://essence-quebec.ca/#organization" },
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
          <PageTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
