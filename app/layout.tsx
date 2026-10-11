import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qz Loop — Scroll. Solve. Improve. Repeat.",
  description: "A mobile-first, infinite-scroll competitive quiz app for Indian students preparing for competitive exams like SSC CGL.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Qz Loop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#5300b7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col justify-between items-center selection:bg-primary-fixed selection:text-primary">
        <div className="w-full max-w-[480px] min-h-screen bg-surface-container-lowest flex flex-col relative shadow-[0_0_24px_rgba(0,0,0,0.06)] md:border-x md:border-surface-container-high/60">
          {children}
        </div>
      </body>
    </html>
  );
}
