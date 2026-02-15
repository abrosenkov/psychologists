import Link from "next/link";
import React from "react";
import css from "./Button.module.css";
import clsx from "clsx";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "outline";
  className?: string;
  disabled?: boolean;
}

export const Button = ({
  children,
  href,
  onClick,
  type = "button",
  className,
}: ButtonProps) => {
  const rootClassName = clsx(css.ctaButton, className);

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={rootClassName}>
      {children}
    </button>
  );
};
