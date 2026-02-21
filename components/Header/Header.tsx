"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import css from "./Header.module.css";
import { useEffect, useState } from "react";
import AuthNavigation from "../AuthNavigation/AuthNavigation";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Psychologists", href: "/psychologists" },
];

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className={css.headerWrapper}>
      <header className={css.header}>
        <div className={`${css.navWrapper} container`}>
          <Link href="/" aria-label="Home">
            <p className={css.logo}>
              <span>psychologists.</span>services
            </p>
          </Link>

          {isOpen ? (
            <button
              className={css.closeMenuButton}
              aria-label="Close Mobile Menu"
              onClick={() => setIsOpen(false)}
            >
              <svg className={css.iconCloseMenu}>
                <use href="/sprite.svg#close-menu" />
              </svg>
            </button>
          ) : (
            <button
              className={css.mobileMenuButton}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(true)}
              aria-label="Open Mobile Menu"
            >
              <svg className={css.iconMobileMenu}>
                <use href="/sprite.svg#burger" />
              </svg>
            </button>
          )}

          <nav className={css.menu} aria-label="Main Navigation">
            <ul className={css.navigation}>
              {NAV_LINKS.map(({ name, href }) => {
                const isActive = pathname === href && pathname !== "/";

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={clsx(css.link, isActive && css.active)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {name}
                    </Link>
                  </li>
                );
              })}
              {pathname !== "/" && (
                <li>
                  <Link
                    href="/favorites"
                    className={clsx(
                      css.link,
                      pathname === "/favorites" && css.active
                    )}
                    aria-current={
                      pathname === "/favorites" ? "page" : undefined
                    }
                  >
                    Favorites
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <div className={css.authNavigationWrapper}>
            <AuthNavigation />
          </div>
        </div>
      </header>

      <div
        className={clsx(
          css.mobileNavigationWapper,
          isOpen ? css.activeMenu : null
        )}
      >
        <nav className={css.mobileMenu} aria-label="Mobile Navigation">
          <ul className={css.mobileNavigation}>
            {NAV_LINKS.map(({ name, href }) => {
              const isActive = pathname === href && pathname !== "/";

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(css.link, isActive && css.active)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
            {pathname !== "/" && (
              <li>
                <Link
                  href="/favorites"
                  className={clsx(
                    css.link,
                    pathname === "/favorites" && css.active
                  )}
                  aria-current={pathname === "/favorites" ? "page" : undefined}
                >
                  Favorites
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
