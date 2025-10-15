import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { manrope } from "@/styles/fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ActiveUserPushNotifications } from "@/components/ActiveUserPushNotifications"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Script from "next/script"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"  // 👈 ADD THIS

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Trusted Dog Walking in Bengaluru | Zubo Pets",
  description:
    "Professional dog walking services in Bengaluru. Trusted by pet parents for safe, reliable walks with trained walkers.",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zubo Pets",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Zubo Pets" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="Zubo Pets" />
        <meta name="apple-mobile-web-app-status-bar-style" content="Zubo Pets" />
        <meta name="apple-mobile-web-app-title" content="Zubo Pets" />
        <meta name="mobile-web-app-capable" content="Zubo Pets" />

        {/* ✅ Google Analytics Scripts */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>

      <body className={`${manrope.variable} font-manrope`}>
        <Toaster />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          <AuthProvider>
            <Suspense fallback={null}>
              <ActiveUserPushNotifications vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""}
              />
            </Suspense>

            <GoogleAnalytics />

            {children}

            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
