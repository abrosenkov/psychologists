"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./RegistrationForm.module.css";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "../UI/Button/Button";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  AuthError,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import toast from "react-hot-toast";

interface RegistrationFormProps {
  onSuccess: () => void;
}

const RegistrationSchema = Yup.object({
  name: Yup.string()
    .min(3, "Minimum 3 characters")
    .required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Minimum 8 characters")
    .required("Password is required"),
});

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={css.wrapper}>
      <h2 className={css.title}>Registration</h2>

      <p className={css.subtitle}>
        Thank you for your interest in our platform! In order to register, we
        need some information. Please provide us with the following information.
      </p>

      <Formik
        initialValues={{ name: "", email: "", password: "" }}
        validationSchema={RegistrationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              values.email,
              values.password
            );

            await updateProfile(userCredential.user, {
              displayName: values.name,
            });

            await set(ref(db, `users/${userCredential.user.uid}`), {
              name: values.name,
              email: values.email,
              createdAt: Date.now(),
            });

            toast.success("Account created successfully 🎉");
            onSuccess();
          } catch (error) {
            const authError = error as AuthError;

            const errorMap: Record<string, string> = {
              "auth/email-already-in-use": "This email is already registered",
              "auth/invalid-email": "Invalid email address",
              "auth/weak-password": "Password should be at least 8 characters",
              "auth/too-many-requests": "Too many attempts. Try later",
            };

            toast.error(errorMap[authError.code] || "Registration failed");
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
                  name="name"
                  type="text"
                  placeholder="Name"
                  className={css.input}
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className={css.error}
                />
              </div>

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
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
