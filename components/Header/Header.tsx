"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import css from "./Header.module.css";
import { useEffect, useRef, useState } from "react";
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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const isHeaderVisibleRef = useRef(true);
  const isAdjustingScrollRef = useRef(false);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const role = useAuthStore((state) => state.role);
  const isAdminActive = pathname === "/admin" || pathname.startsWith("/admin/");
  const shouldHideHeader = !isMobileMenuOpen && !isHeaderVisible;

  useEffect(() => {
    const updateHeaderOffset = () => {
      const headerHeight = headerRef.current?.offsetHeight ?? 96;
      const headerOffset = shouldHideHeader ? 0 : headerHeight;

      document.documentElement.style.setProperty(
        "--app-header-height",
        `${headerHeight}px`
      );
      document.documentElement.style.setProperty(
        "--app-header-visible-offset",
        `${headerOffset}px`
      );
    };

    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && headerRef.current
        ? new ResizeObserver(updateHeaderOffset)
        : null;

    resizeObserver?.observe(headerRef.current as HTMLDivElement);

    return () => {
      window.removeEventListener("resize", updateHeaderOffset);
      resizeObserver?.disconnect();
    };
  }, [shouldHideHeader]);

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

  useEffect(() => {
    isHeaderVisibleRef.current = isHeaderVisible;
  }, [isHeaderVisible]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (isAdjustingScrollRef.current) {
        lastScrollYRef.current = currentScrollY;
        isAdjustingScrollRef.current = false;
        return;
      }

      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 0 || isMobileMenuOpen) {
        setIsHeaderVisible(true);
        isHeaderVisibleRef.current = true;
      } else if (scrollDelta > 8) {
        setIsHeaderVisible(false);
        isHeaderVisibleRef.current = false;
      } else if (scrollDelta < -8) {
        if (!isHeaderVisibleRef.current) {
          const headerHeight = headerRef.current?.offsetHeight ?? 0;
          isAdjustingScrollRef.current = headerHeight > 0;
          window.scrollBy(0, -headerHeight);
          lastScrollYRef.current = Math.max(0, currentScrollY - headerHeight);

          setIsHeaderVisible(true);
          isHeaderVisibleRef.current = true;
          return;
        }

        setIsHeaderVisible(true);
        isHeaderVisibleRef.current = true;
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      ref={headerRef}
      className={clsx(
        css.headerWrapper,
        shouldHideHeader && css.headerHidden
      )}
    >
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
                    <>
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
                      <li>
                        <Link
                          href="/profile"
                          className={clsx(
                            css.link,
                            pathname === "/profile" && css.active
                          )}
                          aria-current={
                            pathname === "/profile" ? "page" : undefined
                          }
                        >
                          Profile
                        </Link>
                      </li>
                    </>
                  )}
              {!loading && user && role === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    className={clsx(css.link, isAdminActive && css.active)}
                    aria-current={isAdminActive ? "page" : undefined}
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
                  <>
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
                    <li>
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={clsx(
                          css.link,
                          pathname === "/profile" && css.active
                        )}
                        aria-current={
                          pathname === "/profile" ? "page" : undefined
                        }
                      >
                        Profile
                      </Link>
                    </li>
                  </>
                )}
            {!loading && user && role === "admin" && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(css.link, isAdminActive && css.active)}
                  aria-current={isAdminActive ? "page" : undefined}
                >
                  Admin
                </Link>
              </li>
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
