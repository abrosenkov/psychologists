"use client";

import css from "./AuthNavigation.module.css";
import { Button } from "../UI/Button/Button";

interface AuthNavigationProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function AuthNavigation({
  onLoginClick,
  onRegisterClick,
}: AuthNavigationProps) {
  return (
    <ul className={css.navigationList}>
      <li className={css.navigationItem}>
        <Button
          onClick={() => {
            console.log("LOGIN CLICK");
            onLoginClick();
          }}
          className={css.loginBtn}
        >
          Log In
        </Button>
      </li>

      <li className={css.navigationItem}>
        <Button onClick={onRegisterClick}>Registration</Button>
      </li>
    </ul>
  );
}
