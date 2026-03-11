import css from "./AuthSkeleton.module.css";

export default function AuthSkeleton() {
  return (
    <div className={css.wrapper}>
      <div className={css.avatar}></div>
      <div className={css.name}></div>
      <div className={css.button}></div>
    </div>
  );
}
