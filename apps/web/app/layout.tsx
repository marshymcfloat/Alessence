import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TanstackProvider from "@/components/providers/TanstackProvider";
import { Toaster } from "@/components/ui/sonner";
import ReduxProvider from "@/components/providers/ReduxProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { RouteProgressBar } from "@/components/RouteProgressBar";
import { Suspense } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://alessence.vercel.app"
  ),
  title: {
    default: "Alessence | AI Study Companion for Accountancy & Law",
    template: "%s | Alessence",
  },
  description:
    "Your personal study space. Manage tasks, organize files, and generate AI-powered exams for accountancy and law studies in the Philippines.",
  applicationName: "Alessence",
  authors: [{ name: "Alessence Team", url: "https://alessence.vercel.app" }],
  generator: "Next.js",
  keywords: [
    "study assistant",
    "AI tutor",
    "accountancy",
    "CPA board exam",
    "Philippine Law",
    "bar exam reviewer",
    "flashcards",
    "productivity tools",
    "student planner",
    "exam generator",
    "study",
    "AI",
    "exams",
    "accountancy",
    "flashcards",
    "tasks",
    "organization",
    "student productivity",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Alessence Team",
  publisher: "Alessence",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Alessence | AI Study Companion",
    description:
      "Manage your tasks, organize your files, and generate AI-powered exams for your accountancy studies.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://alessence.vercel.app",
    siteName: "Alessence",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Alessence Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alessence | AI Study Companion",
    description:
      "Manage your tasks, organize your files, and generate AI-powered exams for your accountancy studies.",
    images: ["/logo.png"],
    creator: "@alessence",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    title: "Alessence",
    statusBarStyle: "default",
    startupImage: ["/logo.png"],
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950 dark:via-purple-950 dark:to-blue-950`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Alessence",
                "url": "https://alessence.vercel.app",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://alessence.vercel.app/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Alessence",
                "applicationCategory": "EducationalApplication",
                "operatingSystem": "Any",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "description": "Your personal study space. Manage tasks, organize files, and generate AI-powered exams for accountancy and law studies.",
                "image": "https://alessence.vercel.app/logo.png",
                "url": "https://alessence.vercel.app",
                "author": {
                  "@type": "Organization",
                  "name": "Alessence Team",
                  "url": "https://alessence.vercel.app"
                }
              }),
            }}
          />
          <main className="min-h-screen w-full relative">
            <ReduxProvider>
              <TanstackProvider>
                {children}
                <Toaster />
              </TanstackProvider>
            </ReduxProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
