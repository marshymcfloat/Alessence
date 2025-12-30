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
    default: "Alessence | AI Study Companion",
    template: "%s | Alessence",
  },
  description:
    "Manage your tasks, organize your files, and generate AI-powered exams for your accountancy studies. Your personal study space.",
  keywords: [
    "study",
    "AI",
    "exams",
    "accountancy",
    "flashcards",
    "tasks",
    "organization",
    "student productivity",
  ],
  authors: [{ name: "Alessence Team" }],
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
