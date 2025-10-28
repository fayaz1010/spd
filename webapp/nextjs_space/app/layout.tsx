
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FloatingQuoteButton } from "@/components/FloatingQuoteButton";
import { FloatingCalculatorCTA } from "@/components/FloatingCalculatorCTA";
import ChatbotProvider from "@/components/chatbot/ChatbotProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "Sun Direct Power - Perth's Premium Solar Installation Experts",
  description: "Save thousands on your power bills with premium solar systems. Over $20,000 in combined Federal and WA rebates available. See your personalized savings in 60 seconds.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  icons: {
    icon: "/logos/sdp-favicon.ico",
    shortcut: "/logos/sdp-favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SDP Installer",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SDP Installer" />
        {/* QR Code Scanner Library */}
        <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
        {/* Barcode Scanner Library (supports 1D barcodes) */}
        <script src="https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js"></script>
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <FloatingQuoteButton />
        <FloatingCalculatorCTA />
        <ChatbotProvider />
      </body>
    </html>
  );
}
