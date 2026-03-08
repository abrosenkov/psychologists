"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import css from "./RegistrationForm.module.css";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "../UI/Button/Button";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDatabase, ref, set } from "firebase/database";

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

  const handleRegistration = async (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await updateProfile(userCredential.user, { displayName: values.name });
      const db = getDatabase();
      await set(ref(db, `users/${userCredential.user.uid}`), {
        name: values.name,
        email: values.email,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  };

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
            await handleRegistration(values);
            onSuccess();
          } catch (error) {
            console.error("Error during registration:", error);
            throw error;
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
