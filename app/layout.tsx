import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppLayoutWrapper } from "@/components/layout/AppLayoutWrapper";
import { AuthSync } from "@/components/auth/AuthSync";

export const metadata: Metadata = {
  title: "Qz Loop — Scroll. Solve. Improve. Repeat.",
  description: "India's first mobile-first vertical-scroll micro-practice app for competitive exam aspirants (SSC, Railways, NEET, JEE & UPSC). 15-second active recall questions. Zero guilt.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Qz Loop — Don't Fight The Doomscroll. Weaponize It.",
    description: "Replace mindless Instagram scrolling with 15-second syllabus-accurate exam questions. Real negative marking, spaced repetition, and 1v1 challenges.",
    url: "https://qz-loop-home.vercel.app",
    siteName: "Qz Loop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qz Loop — India's 1st Reels-Style Exam Quiz App",
    description: "Scroll. Solve. Improve. Repeat. 25 PYQs solved in 10 minutes.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Qz Loop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#07090e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* Instant theme initializer: Light mode is default unless user explicitly chose dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('qz_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#07090e] font-sans text-slate-100 antialiased min-h-screen flex flex-col justify-between items-center selection:bg-purple-500/30 selection:text-white">
        <AuthSync />
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
