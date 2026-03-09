"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./LoginForm.module.css";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "../UI/Button/Button";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

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

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      console.log("User logged in:", userCredential.user);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

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
            await handleLogin(values);
            onSuccess();
          } catch (error) {
            console.error(error);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {() => (
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
            <Button type="submit" className={css.submitBtn}>
              Log In
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
