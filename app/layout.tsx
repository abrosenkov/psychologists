import "normalize.css";
import "./globals.css";
import type { Metadata } from "next";
import TanStackProvider from "../components/TanStackProvider/TanStackProvider";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header/Header";
import AuthListener from "@/components/AuthListener/AuthListener";
import Script from "next/script";
import ThemeSwitcher from "@/components/ThemeSwitcher/ThemeSwitcher";

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
    default: "Psychologists - find your specialist",
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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var savedTheme = localStorage.getItem("app-theme");
                var legacyThemes = { mint: "green", ocean: "blue", berry: "green" };
                var allowedThemes = ["green", "orange", "blue", "dark"];
                if (legacyThemes[savedTheme]) {
                  savedTheme = legacyThemes[savedTheme];
                  localStorage.setItem("app-theme", savedTheme);
                }
                if (allowedThemes.indexOf(savedTheme) === -1) {
                  savedTheme = null;
                }
                var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var theme = savedTheme || (prefersDark ? "dark" : "green");
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
              } catch (error) {
                document.documentElement.dataset.theme = "green";
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.variable}>
        <TanStackProvider>
          <AuthListener />
          <Header />
          {children}
          <ThemeSwitcher />
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
                background: "var(--color-surface-raised)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-soft)",
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
                  primary: "var(--color-accent)",
                  secondary: "var(--color-surface-raised)",
                },
              },
            }}
          />
        </TanStackProvider>
      </body>
    </html>
  );
}
