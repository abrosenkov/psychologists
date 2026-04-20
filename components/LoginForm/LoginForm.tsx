"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./LoginForm.module.css";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "../UI/Button/Button";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Minimum 8 characters")
    .required("Password is required"),
});

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);

  return (
    <div className={css.wrapper}>
      <h2 className={css.title}>Log In</h2>

      <p className={css.subtitle}>
        Welcome back! Please enter your credentials to access your account and
        continue your search for a psychologist.
      </p>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const cred = await signInWithEmailAndPassword(
              auth,
              values.email,
              values.password
            );

            const uid = cred.user.uid;
            const userRef = ref(db, `users/${uid}`);
            const snapshot = await get(userRef);
            const data = snapshot.val();

            if (!snapshot.exists()) {
              await set(userRef, {
                email: cred.user.email || "",
                role: "user",
              });
            } else if (!data?.role) {
              await update(userRef, {
                role: "user",
              });
            }

            const freshSnapshot = await get(userRef);
            const userData = freshSnapshot.val();

            setUser(cred.user);
            setRole(userData?.role || "user");

            toast.success("Welcome back!");
            onSuccess();
          } catch (error) {
            const authError = error as AuthError;

            const errorMap: Record<string, string> = {
              "auth/invalid-credential": "Wrong email or password",
              "auth/user-not-found": "User not found",
              "auth/too-many-requests": "Too many attempts. Try later",
            };

            toast.error(errorMap[authError.code] || "Login failed");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className={css.form}>
            <div className={css.fieldsWrapper}>
              <div className={css.fieldWrapper}>
                <Field
                  name="email"
                  type="email"
                  placeholder="Email"
                  className={css.input}
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className={css.error}
                />
              </div>

              <div className={css.fieldWrapper}>
                <div className={css.passwordWrapper}>
                  <Field
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className={css.input}
                  />

                  <button
                    type="button"
                    className={css.eyeButton}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>

                <ErrorMessage
                  name="password"
                  component="div"
                  className={css.error}
                />
              </div>
            </div>

            <Button
              type="submit"
              className={css.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
