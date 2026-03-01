"use client";

import css from "./AuthNavigation.module.css";
import { Button } from "../UI/Button/Button";

interface AuthNavigationProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onCloseMobMenu?: () => void;
}

export default function AuthNavigation({
  onLoginClick,
  onRegisterClick,
  onCloseMobMenu,
}: AuthNavigationProps) {
  return (
    <ul className={css.navigationList}>
      <li className={css.navigationItem}>
        <Button
          onClick={() => {
            onLoginClick();
            onCloseMobMenu?.();
          }}
          className={css.loginBtn}
        >
          Log In
        </Button>
      </li>

      <li className={css.navigationItem}>
        <Button
          onClick={() => {
            onRegisterClick();
            onCloseMobMenu?.();
          }}
        >
          Registration
        </Button>
      </li>
    </ul>
  );
}
