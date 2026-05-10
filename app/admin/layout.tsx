"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import Loader from "@/components/Loader/Loader";
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
    return (
      <div className={css.loading}>
        <Loader />
      </div>
    );
  }

  if (!user || role !== "admin") {
    return null;
  }

  const getLinkClassName = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" ? css.activeLink : css.link;
    }

    return pathname === href || pathname.startsWith(`${href}/`)
      ? css.activeLink
      : css.link;
  };

  return (
    <div className={css.wrapper}>
      <aside className={css.sidebar}>
        <div className={css.logo}>Admin Panel</div>

        <nav className={css.nav}>
          <Link
            href="/admin"
            className={getLinkClassName("/admin")}
          >
            Dashboard
          </Link>

          <Link
            href="/admin/psychologists"
            className={getLinkClassName("/admin/psychologists")}
          >
            Psychologists
          </Link>

          <Link
            href="/admin/bookings"
            className={getLinkClassName("/admin/bookings")}
          >
            Bookings
          </Link>

          <Link
            href="/admin/reviews"
            className={getLinkClassName("/admin/reviews")}
          >
            Reviews
          </Link>
        </nav>
      </aside>

      <main className={css.content}>{children}</main>
    </div>
  );
}
