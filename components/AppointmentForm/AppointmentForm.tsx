"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useMemo } from "react";
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
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuClock,
} from "react-icons/lu";

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

const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const selectedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return toDateKey(new Date());
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay);

  startDate.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function formatSelectedDate(value: string) {
  const date = parseDateKey(value);

  return date ? selectedDateFormatter.format(date) : "Select date";
}

export default function AppointmentForm({
  psychologist,
  onClose,
}: {
  psychologist: Psychologist;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const {
    appointments,
    addAppointment,
    setAppointments,
    draft,
    setDraft,
    clearDraft,
  } =
    useAppointmentStore();

  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availability, setAvailability] =
    useState<Availability>(initialAvailability);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const currentDate = getTodayKey();
  const hasDraft = Boolean(
    draft.name ||
      draft.email ||
      draft.phone !== "+380" ||
      draft.date ||
      draft.time ||
      draft.comment
  );
  const initialFormValues = useMemo(
    () => ({
      name: hasDraft ? draft.name : user?.displayName || "",
      email: hasDraft ? draft.email : user?.email || "",
      phone: hasDraft ? draft.phone : "+380",
      date: draft.date || currentDate,
      time: draft.time || "",
      comment: draft.comment || "",
    }),
    [currentDate, draft, hasDraft, user?.displayName, user?.email]
  );

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
      const target = e.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsTimeOpen(false);
      }

      if (datePickerRef.current && !datePickerRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    };

    if (isTimeOpen || isDateOpen) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [isTimeOpen, isDateOpen]);

  const handleDateOpen = (value: string) => {
    const selectedDate = parseDateKey(value) ?? new Date();

    setCalendarMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
    setIsDateOpen((isOpen) => !isOpen);
    setIsTimeOpen(false);
  };

  const handleSubmit = async (
    values: AppointmentFormValues,
    { setSubmitting }: FormikHelpers<AppointmentFormValues>
  ) => {
    if (!user) return toast.error("Please log in to book an appointment.");

    const submissionValues = {
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      comment: values.comment.trim(),
    };
    const selectedDate = submissionValues.date;
    const selectedTime = normalizeTime(submissionValues.time);
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
        ...submissionValues,
        psychologistId: psychologist.id,
        date: selectedDate,
        time: selectedTime,
      });

      addAppointment({
        psychologistId: psychologist.id,
        time: selectedTime,
        date: selectedDate,
      });

      clearDraft();

      toast.success("Appointment request sent successfully.");
      onClose();
    } catch {
      toast.error("Failed to book the appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={css.wrapper}>
      <Formik
        initialValues={initialFormValues}
        enableReinitialize={true}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, isSubmitting, values }) => {
          const selectedDate = values.date || currentDate;
          const isDayClosed = Boolean(availability.closedDays[selectedDate]);
          const calendarDays = getCalendarDays(calendarMonth);

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

                  <div className={css.fieldBox} ref={datePickerRef}>
                    <button
                      type="button"
                      className={clsx(css.input, css.dateButton)}
                      onClick={() => handleDateOpen(selectedDate)}
                      aria-expanded={isDateOpen}
                    >
                      <span>{formatSelectedDate(selectedDate)}</span>
                      <LuCalendar className={css.dateIcon} />
                    </button>

                    {isDateOpen && (
                      <div className={css.calendarDropdown}>
                        <div className={css.calendarHeader}>
                          <button
                            type="button"
                            className={css.calendarNav}
                            aria-label="Previous month"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() - 1,
                                  1
                                )
                              )
                            }
                          >
                            <LuChevronLeft />
                          </button>
                          <p className={css.calendarTitle}>
                            {monthFormatter.format(calendarMonth)}
                          </p>
                          <button
                            type="button"
                            className={css.calendarNav}
                            aria-label="Next month"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() + 1,
                                  1
                                )
                              )
                            }
                          >
                            <LuChevronRight />
                          </button>
                        </div>

                        <div className={css.weekDays}>
                          {weekDays.map((day) => (
                            <span key={day}>{day}</span>
                          ))}
                        </div>

                        <div className={css.calendarGrid}>
                          {calendarDays.map((date) => {
                            const dateKey = toDateKey(date);
                            const isOutsideMonth =
                              date.getMonth() !== calendarMonth.getMonth();
                            const isPast = dateKey < currentDate;
                            const isSelected = dateKey === selectedDate;
                            const isClosed = Boolean(
                              availability.closedDays[dateKey]
                            );
                            const isDisabled = isPast || isClosed;

                            return (
                              <button
                                key={dateKey}
                                type="button"
                                className={clsx(
                                  css.calendarDay,
                                  isOutsideMonth && css.calendarDayMuted,
                                  isSelected && css.calendarDaySelected,
                                  isClosed && css.calendarDayClosed
                                )}
                                disabled={isDisabled}
                                title={isClosed ? "Closed" : undefined}
                                onClick={() => {
                                  setFieldValue("date", dateKey);
                                  setFieldValue("time", "");
                                  setIsDateOpen(false);
                                }}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
