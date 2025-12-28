import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "$PUMP - GET SOME PUMP",
  description:
    "Track Pump.fun creator revenue share, automatic claims and disbursements in real-time with this fun, cartoonish dashboard.",
  keywords: "Pump.fun, Solana, creator revenue, meme coin, crypto dashboard",
  openGraph: {
    title: "$PUMP - GET SOME PUMP",
    description: "Track Pump.fun creator revenue share and automatic disbursements in real-time",
    images: ["/og-image.png"],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
