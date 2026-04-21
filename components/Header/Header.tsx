"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import css from "./Header.module.css";
import { useEffect, useState } from "react";
import AuthNavigation from "../AuthNavigation/AuthNavigation";
import Modal from "../Modal/Modal";
import RegisterForm from "../RegisterForm/RegisterForm";
import LoginForm from "../LoginForm/LoginForm";
import { useAuthStore } from "@/stores/useAuthStore";
import UserMenu from "../UserMenu/UserMenu";
import AuthSkeleton from "../AuthSkeleton/AuthSkeleton";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Psychologists", href: "/psychologists" },
];

export default function Header() {
  const pathname = usePathname();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={css.headerWrapper}>
      <header className={css.header}>
        <div className={`${css.navWrapper} container`}>
          <Link className={css.logoLink} href="/" aria-label="Home">
            <p className={css.logo}>
              <span>psychologists.</span>services
            </p>
          </Link>

          {isMobileMenuOpen ? (
            <button
              className={css.closeMenuButton}
              aria-label="Close Mobile Menu"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className={css.iconCloseMenu}>
                <use href="/sprite.svg#close-menu" />
              </svg>
            </button>
          ) : (
            <button
              className={css.mobileMenuButton}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
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
              {loading
                ? null
                : user && (
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
              {!loading && user && role === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    className={clsx(
                      css.link,
                      pathname === "/admin" && css.active
                    )}
                    aria-current={pathname === "/admin" ? "page" : undefined}
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <div className={css.authNavigationWrapper}>
            {loading ? (
              <AuthSkeleton />
            ) : user ? (
              <UserMenu onLogout={closeMobileMenu} />
            ) : (
              <AuthNavigation
                onLoginClick={() => setAuthMode("login")}
                onRegisterClick={() => setAuthMode("register")}
              />
            )}
          </div>
        </div>
      </header>

      <div
        className={clsx(
          css.mobileNavigationWapper,
          isMobileMenuOpen ? css.activeMenu : null
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
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(css.link, isActive && css.active)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
            {loading
              ? null
              : user && (
                  <li>
                    <Link
                      href="/favorites"
                      onClick={() => setIsMobileMenuOpen(false)}
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
            {!loading && user && role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(css.link, pathname === "/admin" && css.active)}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                Admin
              </Link>
            )}
          </ul>
        </nav>
        <div className={css.authNavigationMobileWrapper}>
          {loading ? (
            <AuthSkeleton />
          ) : user ? (
            <UserMenu onLogout={closeMobileMenu} />
          ) : (
            <AuthNavigation
              onLoginClick={() => setAuthMode("login")}
              onRegisterClick={() => setAuthMode("register")}
            />
          )}
        </div>
      </div>
      <Modal isOpen={!!authMode} onCloseModal={() => setAuthMode(null)}>
        {authMode === "login" && (
          <LoginForm
            onSuccess={() => {
              setAuthMode(null);
              closeMobileMenu();
            }}
          />
        )}

        {authMode === "register" && (
          <RegisterForm
            onSuccess={() => {
              setAuthMode(null);
              closeMobileMenu();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
