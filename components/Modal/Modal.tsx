"use client";

import { createPortal } from "react-dom";
import css from "./Modal.module.css";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onCloseModal: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onCloseModal, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCloseModal]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCloseModal();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={css.backdrop} onClick={handleBackdropClick}>
      <div
        className={css.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Modal dialog"
      >
        <button
          type="button"
          className={css.closeModalButton}
          aria-label="Close modal"
          onClick={onCloseModal}
        >
          <svg className={css.iconCloseMenu}>
            <use href="/sprite.svg#close-menu" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
