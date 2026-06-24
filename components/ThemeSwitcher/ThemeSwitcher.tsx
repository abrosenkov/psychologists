"use client";

import { ChevronDown, Moon } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import css from "./ThemeSwitcher.module.css";

type ThemeName = "green" | "orange" | "blue" | "dark";

const THEMES: Array<{
  name: ThemeName;
  label: string;
  ariaLabel: string;
  swatch: string;
}> = [
  {
    name: "green",
    label: "Green",
    ariaLabel: "Use green theme",
    swatch: "#54be96",
  },
  {
    name: "orange",
    label: "Orange",
    ariaLabel: "Use orange theme",
    swatch: "#ff7a1a",
  },
  {
    name: "blue",
    label: "Blue",
    ariaLabel: "Use blue theme",
    swatch: "#3470ff",
  },
  {
    name: "dark",
    label: "Dark",
    ariaLabel: "Use dark theme",
    swatch: "#111827",
  },
];

const LEGACY_THEME_MAP: Record<string, ThemeName> = {
  mint: "green",
  ocean: "blue",
  berry: "green",
};

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "green";

  const savedTheme = window.localStorage.getItem("app-theme");
  if (savedTheme && savedTheme in LEGACY_THEME_MAP) {
    return LEGACY_THEME_MAP[savedTheme];
  }

  if (savedTheme && THEMES.some((theme) => theme.name === savedTheme)) {
    return savedTheme as ThemeName;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "green";
}

function subscribeToThemeChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("app-theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("app-theme-change", callback);
  };
}

function getThemeSnapshot(): ThemeName {
  return getInitialTheme();
}

function getServerThemeSnapshot(): ThemeName {
  return "green";
}

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === "dark" ? "dark" : "light";
}

export default function ThemeSwitcher() {
  const selectedTheme = useSyncExternalStore(
    subscribeToThemeChanges,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const selectedThemeConfig =
    THEMES.find((theme) => theme.name === selectedTheme) ?? THEMES[0];

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleThemeChange = (theme: ThemeName) => {
    window.localStorage.setItem("app-theme", theme);
    applyTheme(theme);
    window.dispatchEvent(new Event("app-theme-change"));
    setIsOpen(false);
  };

  return (
    <div
      ref={switcherRef}
      className={css.switcher}
      aria-label="Theme switcher"
      suppressHydrationWarning
    >
      <button
        type="button"
        className={css.trigger}
        aria-label="Open theme menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        title="Theme"
      >
        <span
          className={css.currentSwatch}
          style={
            { "--theme-swatch": selectedThemeConfig.swatch } as CSSProperties
          }
        >
          {selectedTheme === "dark" && <Moon size={12} aria-hidden="true" />}
        </span>
        <ChevronDown
          className={clsx(css.chevron, isOpen && css.chevronOpen)}
          size={14}
          aria-hidden="true"
        />
      </button>

      <div className={clsx(css.options, isOpen && css.optionsOpen)}>
        {THEMES.map((theme) => (
          <button
            key={theme.name}
            type="button"
            className={clsx(
              css.option,
              selectedTheme === theme.name && css.active
            )}
            style={{ "--theme-swatch": theme.swatch } as CSSProperties}
            aria-label={theme.ariaLabel}
            aria-pressed={selectedTheme === theme.name}
            suppressHydrationWarning
            title={theme.label}
            onClick={() => handleThemeChange(theme.name)}
          >
            <span className={css.swatch} />
            <span className={css.optionLabel}>{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
