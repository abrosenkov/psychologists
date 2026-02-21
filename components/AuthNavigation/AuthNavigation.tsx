import css from "./AuthNavigation.module.css";
import { Button } from "../UI/Button/Button";

export default function AuthNavigation() {
  return (
    <ul className={css.navigationList}>
      <li className={css.navigationItem}>
        <Button href="/sign-in">Log In</Button>
      </li>

      <li className={css.navigationItem}>
        <Button href="/sign-up">Registration</Button>
      </li>
    </ul>
  );
}
