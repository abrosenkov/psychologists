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
          <Toaster position="top-right" reverseOrder={false} />
        </TanStackProvider>
      </body>
    </html>
  );
}
