"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import css from "./admin-layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.replace("/");
    }
  }, [loading, user, role, router]);

  if (loading) {
    return <div className={css.loading}>Loading...</div>;
  }

  if (!user || role !== "admin") {
    return null;
  }

  return (
    <div className={css.wrapper}>
      <aside className={css.sidebar}>
        <div className={css.logo}>Admin Panel</div>

        <nav className={css.nav}>
          <Link
            href="/admin"
            className={pathname === "/admin" ? css.activeLink : css.link}
          >
            Dashboard
          </Link>

          <Link
            href="/admin/psychologists"
            className={
              pathname === "/admin/psychologists" ? css.activeLink : css.link
            }
          >
            Psychologists
          </Link>

          <Link
            href="/admin/bookings"
            className={
              pathname === "/admin/bookings" ? css.activeLink : css.link
            }
          >
            Bookings
          </Link>

          <Link
            href="/admin/reviews"
            className={pathname === "/admin/reviews" ? css.activeLink : css.link}
          >
            Reviews
          </Link>
        </nav>
      </aside>

      <main className={css.content}>{children}</main>
    </div>
  );
}