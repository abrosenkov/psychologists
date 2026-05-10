import "normalize.css";
import "./globals.css";
import type { Metadata } from "next";
import TanStackProvider from "../components/TanStackProvider/TanStackProvider";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header/Header";
import AuthListener from "@/components/AuthListener/AuthListener";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Psychologists — find your specialist",
    template: "%s | Psychologists",
  },
  description:
    "Choose a psychologist: filters by price and rating, favorites, and booking a consultation.",
  openGraph: {
    type: "website",
    siteName: "Psychologists",
    title: "Psychologists",
    description:
      "Find an experienced psychologist, compare specialists, and book a session.",
    images: [
      {
        url: "/hero/hero.webp",
        width: 464,
        height: 526,
        alt: "Psychologists platform",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.variable}>
        <TanStackProvider>
          <AuthListener />
          <Header />
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={10}
            containerClassName="toastContainer"
            toastOptions={{
              duration: 4200,
              className: "appToast",
              style: {
                width: "min(420px, calc(100vw - 40px))",
                maxWidth: "calc(100vw - 40px)",
                background: "#ffffff",
                color: "#191a15",
                border: "1px solid rgba(25, 26, 21, 0.08)",
                boxShadow: "0 18px 50px rgba(17, 24, 39, 0.14)",
              },
              success: {
                className: "appToast appToastSuccess",
                iconTheme: {
                  primary: "#16a34a",
                  secondary: "#ffffff",
                },
              },
              error: {
                className: "appToast appToastError",
                duration: 5200,
                iconTheme: {
                  primary: "#dc2626",
                  secondary: "#ffffff",
                },
              },
              loading: {
                className: "appToast appToastLoading",
                iconTheme: {
                  primary: "#54be96",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </TanStackProvider>
      </body>
    </html>
  );
}
