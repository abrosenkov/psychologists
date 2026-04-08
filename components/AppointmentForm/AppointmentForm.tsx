"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  useFormikContext,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import clsx from "clsx";
import toast from "react-hot-toast";
import { LuClock } from "react-icons/lu";

import { useAuthStore } from "@/stores/useAuthStore";
import { useAppointmentStore } from "@/stores/useAppointmentStore";
import { createAppointment, getBusySlots } from "@/lib/appointments";
import { Psychologist } from "@/types/psychologist";
import css from "./AppointmentForm.module.css";

interface AppointmentFormValues {
  name: string;
  email: string;
  phone: string;
  time: string;
  comment: string;
}

const schema = Yup.object({
  name: Yup.string().min(2, "Too short").required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^\+380\d{9}$/, "Format: +380XXXXXXXXX")
    .required("Phone is required"),
  time: Yup.string().required("Time is required"),
  comment: Yup.string().max(500, "Too long"),
});

const AutoSave = ({
  onSave,
}: {
  onSave: (values: AppointmentFormValues) => void;
}) => {
  const { values } = useFormikContext<AppointmentFormValues>();
  useEffect(() => {
    onSave(values);
  }, [values, onSave]);
  return null;
};

const TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

export default function AppointmentForm({
  psychologist,
  onClose,
}: {
  psychologist: Psychologist;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const { appointments, addAppointment, setAppointments, draft, setDraft } =
    useAppointmentStore();

  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const busyData = await getBusySlots(psychologist.id);
        setAppointments(
          busyData.map((slot) => ({
            ...slot,
            psychologistId: psychologist.id,
          }))
        );
      } catch (error) {
        console.error("Failed to load slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [psychologist.id, setAppointments]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsTimeOpen(false);
      }
    };
    if (isTimeOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isTimeOpen]);

  const handleSubmit = async (
    values: AppointmentFormValues,
    { setSubmitting, resetForm }: FormikHelpers<AppointmentFormValues>
  ) => {
    if (!user) return toast.error("Please log in first");

    const isBusy = appointments.some(
      (a) =>
        a.psychologistId === psychologist.id &&
        a.time === values.time &&
        a.date === currentDate
    );

    if (isBusy) {
      toast.error(`Time ${values.time} is already booked!`);
      setSubmitting(false);
      return;
    }

    try {
      await createAppointment(user.uid, {
        ...values,
        psychologistId: psychologist.id,
        date: currentDate,
      });

      addAppointment({
        psychologistId: psychologist.id,
        time: values.time,
        date: currentDate,
      });

      const initialValues = {
        name: "",
        email: "",
        phone: "+380",
        time: "",
        comment: "",
      };
      setDraft(initialValues);

      toast.success("Appointment booked! ✅");
      resetForm({ values: initialValues });
      onClose();
    } catch {
      toast.error("Error booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={css.wrapper}>
      <Formik
        initialValues={{
          name: draft.name || user?.displayName || "",
          email: draft.email || user?.email || "",
          phone: draft.phone || "+380",
          time: draft.time || "",
          comment: draft.comment || "",
        }}
        enableReinitialize={true}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, isSubmitting }) => (
          <Form className={css.form}>
            <AutoSave onSave={setDraft} />

            <h2 className={css.title}>
              Make an appointment with a psychologist
            </h2>
            <p className={css.text}>
              You are on the verge of changing your life for the better...
            </p>

            <div className={css.psychologist}>
              <Image
                src={psychologist.avatar_url}
                alt={psychologist.name}
                className={css.avatar}
                width={44}
                height={44}
              />
              <div>
                <p className={css.label}>Your psychologist</p>
                <p className={css.name}>{psychologist.name}</p>
              </div>
            </div>

            <div className={css.fieldBox}>
              <Field name="name" placeholder="Name" className={css.input} />
              <ErrorMessage name="name" component="div" className={css.error} />
            </div>

            <div className={css.row}>
              <div className={css.fieldBox}>
                <Field name="phone" className={css.input} />
                <ErrorMessage
                  name="phone"
                  component="div"
                  className={css.error}
                />
              </div>

              <div className={css.timePicker} ref={dropdownRef}>
                <div
                  className={css.timeInputWrapper}
                  onClick={() => !isLoadingSlots && setIsTimeOpen(!isTimeOpen)}
                >
                  <Field
                    name="time"
                    placeholder={isLoadingSlots ? "Loading..." : "00:00"}
                    readOnly
                    className={css.input}
                  />
                  <LuClock className={css.clockIcon} />
                </div>

                {isTimeOpen && (
                  <div className={css.dropdown}>
                    <p className={css.dropdownTitle}>Meeting time</p>
                    <div className={css.timeList}>
                      {TIMES.map((t) => {
                        const isBusy = appointments.some(
                          (a) =>
                            a.psychologistId === psychologist.id &&
                            a.time === t &&
                            a.date === currentDate
                        );
                        return (
                          <div
                            key={t}
                            className={clsx(
                              css.timeItem,
                              isBusy && css.timeItemDisabled
                            )}
                            onClick={() =>
                              !isBusy &&
                              (setFieldValue("time", t), setIsTimeOpen(false))
                            }
                          >
                            {t}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <ErrorMessage
                  name="time"
                  component="div"
                  className={css.error}
                />
              </div>
            </div>

            <div className={css.fieldBox}>
              <Field name="email" placeholder="Email" className={css.input} />
              <ErrorMessage
                name="email"
                component="div"
                className={css.error}
              />
            </div>

            <Field
              as="textarea"
              name="comment"
              placeholder="Comment"
              className={css.textarea}
            />

            <button
              type="submit"
              className={css.submit}
              disabled={isSubmitting || isLoadingSlots}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
