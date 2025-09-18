import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { Suspense } from "react"

/**
 * App-wide metadata for SEO and browser context.
 * Used by Next.js to set page title, description, and generator.
 */
export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

/**
 * RootLayout wraps the entire app.
 * - Sets up global fonts and antialiasing for consistent UI.
 * - Provides authentication context to all pages via AuthProvider.
 * - Uses Suspense for async loading boundaries.
 * - Includes Vercel Analytics for usage tracking.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body>
        {/* Suspense allows for async loading of child components */}
        <Suspense fallback={<div>Loading...</div>}>
          {/* AuthProvider supplies authentication state/actions to all children */}
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
        {/* Analytics component for Vercel usage tracking */}
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
