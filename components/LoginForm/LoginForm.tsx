"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./LoginForm.module.css";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "../UI/Button/Button";

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
});

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

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
        onSubmit={(values) => {
          console.log(values);
          onSuccess();
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
