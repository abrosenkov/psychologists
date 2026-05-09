"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react";
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
import {
  createAppointment,
  getAvailability,
  getBusySlots,
  normalizeTime,
  TIMES,
  timeKey,
  type Availability,
} from "@/lib/appointments";
import { Psychologist } from "@/types/psychologist";
import css from "./AppointmentForm.module.css";

interface AppointmentFormValues {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  comment: string;
}

const schema = Yup.object({
  name: Yup.string().min(2, "Too short").required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^\+380\d{9}$/, "Format: +380XXXXXXXXX")
    .required("Phone is required"),
  date: Yup.string().required("Date is required"),
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

function PsychologistAvatar({ psychologist }: { psychologist: Psychologist }) {
  const normalizedSrc = psychologist.avatar_url?.trim() || "";
  const [failedSrc, setFailedSrc] = useState("");

  if (!normalizedSrc || failedSrc === normalizedSrc) {
    return (
      <div className={css.avatarPlaceholder}>
        {(psychologist.name.charAt(0) || "?").toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={psychologist.name}
      className={css.avatar}
      onError={() => setFailedSrc(normalizedSrc)}
    />
  );
}

const initialAvailability: Availability = {
  closedDays: {},
  closedSlots: {},
};

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
  const [availability, setAvailability] =
    useState<Availability>(initialAvailability);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const [busyData, availabilityData] = await Promise.all([
          getBusySlots(psychologist.id),
          getAvailability(psychologist.id),
        ]);

        setAvailability(availabilityData);
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

    const selectedDate = values.date;
    const selectedTime = normalizeTime(values.time);
    const isDayClosed = Boolean(availability.closedDays[selectedDate]);
    const isSlotClosed = Boolean(
      availability.closedSlots[selectedDate]?.[timeKey(selectedTime)]
    );
    const isBusy = appointments.some(
      (a) =>
        a.psychologistId === psychologist.id &&
        normalizeTime(a.time) === selectedTime &&
        a.date === selectedDate
    );

    if (isDayClosed || isSlotClosed || isBusy) {
      toast.error("Selected date and time are not available.");
      setSubmitting(false);
      return;
    }

    try {
      await createAppointment(user.uid, {
        ...values,
        psychologistId: psychologist.id,
        date: selectedDate,
        time: selectedTime,
      });

      addAppointment({
        psychologistId: psychologist.id,
        time: selectedTime,
        date: selectedDate,
      });

      const initialValues = {
        name: "",
        email: "",
        phone: "+380",
        date: "",
        time: "",
        comment: "",
      };
      setDraft(initialValues);

      toast.success("Appointment booked!");
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
          date: draft.date || currentDate,
          time: draft.time || "",
          comment: draft.comment || "",
        }}
        enableReinitialize={true}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, isSubmitting, values }) => {
          const selectedDate = values.date || currentDate;
          const isDayClosed = Boolean(availability.closedDays[selectedDate]);

          return (
            <Form className={css.form}>
              <AutoSave onSave={setDraft} />

              <h2 className={css.title}>
                Make an appointment with a psychologist
              </h2>
              <p className={css.text}>
                You are on the verge of changing your life for the better. Fill
                out the short form below to book your personal appointment with
                a professional psychologist. We guarantee confidentiality and
                respect for your privacy.
              </p>

              <div className={css.psychologist}>
                <PsychologistAvatar psychologist={psychologist} />
                <div>
                  <p className={css.label}>Your psychologist</p>
                  <p className={css.name}>{psychologist.name}</p>
                </div>
              </div>

              <div className={css.fieldsWrapper}>
                <div className={css.fieldBox}>
                  <Field name="name" placeholder="Name" className={css.input} />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.timeEmail}>
                  <div className={css.fieldBox}>
                    <Field name="phone" className={css.input} />
                    <ErrorMessage
                      name="phone"
                      component="div"
                      className={css.error}
                    />
                  </div>

                  <div className={css.fieldBox}>
                    <Field
                      type="date"
                      name="date"
                      min={currentDate}
                      className={css.input}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ) => {
                        setFieldValue("date", event.target.value);
                        setFieldValue("time", "");
                      }}
                    />
                    <ErrorMessage
                      name="date"
                      component="div"
                      className={css.error}
                    />
                  </div>
                </div>

                {isDayClosed && (
                  <p className={css.closedNotice}>
                    This day is closed for booking.
                  </p>
                )}

                <div className={css.timePicker} ref={dropdownRef}>
                  <div
                    className={css.timeInputWrapper}
                    onClick={() =>
                      !isLoadingSlots &&
                      !isDayClosed &&
                      setIsTimeOpen(!isTimeOpen)
                    }
                  >
                    <Field
                      name="time"
                      placeholder={isLoadingSlots ? "Loading..." : "00:00"}
                      readOnly
                      className={css.input}
                      disabled={isDayClosed}
                    />
                    <LuClock className={css.clockIcon} />
                  </div>

                  {isTimeOpen && (
                    <div className={css.dropdown}>
                      <p className={css.dropdownTitle}>Meeting time</p>
                      <div className={css.timeList}>
                        {TIMES.map((time) => {
                          const isBusy = appointments.some(
                            (a) =>
                              a.psychologistId === psychologist.id &&
                              normalizeTime(a.time) === time &&
                              a.date === selectedDate
                          );
                          const isClosed = Boolean(
                            availability.closedSlots[selectedDate]?.[
                              timeKey(time)
                            ]
                          );
                          const isDisabled = isDayClosed || isClosed || isBusy;
                          const title = isBusy
                            ? "Booked"
                            : isClosed
                              ? "Closed by admin"
                              : "";

                          return (
                            <div
                              key={time}
                              title={title}
                              className={clsx(
                                css.timeItem,
                                isDisabled && css.timeItemDisabled
                              )}
                              onClick={() =>
                                !isDisabled &&
                                (setFieldValue("time", time),
                                setIsTimeOpen(false))
                              }
                            >
                              {time}
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

                <div className={css.fieldBox}>
                  <Field
                    name="email"
                    placeholder="Email"
                    className={css.input}
                  />
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
              </div>

              <button
                type="submit"
                className={css.submit}
                disabled={isSubmitting || isLoadingSlots || isDayClosed}
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
