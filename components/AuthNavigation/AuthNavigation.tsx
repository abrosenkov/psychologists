import css from "./AuthNavigation.module.css";
import { Button } from "../UI/Button/Button";

export default function AuthNavigation() {
  return (
    <ul className={css.navigationList}>
      <li className={css.navigationItem}>
        <Button className={css.loginBtn} href="/sign-in">
          Log In
        </Button>
      </li>

      <li className={css.navigationItem}>
        <Button href="/registration">Registration</Button>
      </li>
    </ul>
  );
}
