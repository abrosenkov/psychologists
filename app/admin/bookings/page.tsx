"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref, update } from "firebase/database";
import toast from "react-hot-toast";
import {
  LuCalendar,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import Loader from "@/components/Loader/Loader";
import {
  getAvailability,
  normalizeTime,
  setClosedDay,
  setClosedSlot,
  TIMES,
  timeKey,
  type Availability,
} from "@/lib/appointments";
import type { Psychologist } from "@/types/psychologist";
import css from "./page.module.css";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  psychologistId: string;
  psychologistName: string;
  date: string;
  time: string;
  comment?: string;
  status?: "pending" | "confirmed" | "cancelled";
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

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const today = () => toDateKey(new Date());

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay);

  startDate.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

const formatSelectedDate = (value: string) => {
  const date = parseDateKey(value);

  return date ? selectedDateFormatter.format(date) : "Select date";
};

const getFirebaseErrorMessage = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code.includes("permission-denied")) {
    return "Permission denied. Deploy Firebase database rules and check admin role.";
  }

  return "Firebase update failed.";
};

export default function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedPsychologistId, setSelectedPsychologistId] = useState("");
  const [isPsychologistOpen, setIsPsychologistOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });
  const [availability, setAvailability] =
    useState<Availability>(initialAvailability);
  const datePickerRef = useRef<HTMLLabelElement>(null);
  const psychologistSelectRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (!selectedPsychologistId) return;

    loadAvailability(selectedPsychologistId);
  }, [selectedPsychologistId]);

  useEffect(() => {
    if (!isDateOpen && !isPsychologistOpen) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(target)
      ) {
        setIsDateOpen(false);
      }

      if (
        psychologistSelectRef.current &&
        !psychologistSelectRef.current.contains(target)
      ) {
        setIsPsychologistOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [isDateOpen, isPsychologistOpen]);

  const handleDateOpen = () => {
    const date = parseDateKey(selectedDate) ?? new Date();

    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setIsDateOpen((isOpen) => !isOpen);
    setIsPsychologistOpen(false);
  };

  const loadBookings = async () => {
    try {
      const [appointmentsSnap, psychologistsSnap] = await Promise.all([
        get(ref(db, "appointments")),
        get(ref(db, "psychologists")),
      ]);

      const psychologistsData = psychologistsSnap.exists()
        ? (psychologistsSnap.val() as Record<string, Omit<Psychologist, "id">>)
        : {};
      const psychologistsList = Object.entries(psychologistsData).map(
        ([id, value]) => ({
          id,
          ...value,
        })
      );

      setPsychologists(psychologistsList);
      setSelectedPsychologistId((current) => current || psychologistsList[0]?.id || "");

      if (!appointmentsSnap.exists()) {
        setItems([]);
        return;
      }

      const appointmentsData = appointmentsSnap.val() as Record<
        string,
        Omit<Booking, "id" | "psychologistName">
      >;

      const list = Object.entries(appointmentsData).map(([id, value]) => {
        const booking = value;

        return {
          id,
          ...booking,
          psychologistName:
            psychologistsData[booking.psychologistId]?.name || "Unknown",
        };
      });

      setItems(list.reverse());
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (psychologistId: string) => {
    setAvailabilityLoading(true);
    try {
      setAvailability(await getAvailability(psychologistId));
    } catch (error) {
      console.error("Failed to load availability:", error);
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const changeStatus = async (
    id: string,
    status: "confirmed" | "cancelled"
  ) => {
    await update(ref(db, `appointments/${id}`), { status });

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleDayToggle = async () => {
    if (!selectedPsychologistId) return;

    const nextIsClosed = !availability.closedDays[selectedDate];

    try {
      await setClosedDay(selectedPsychologistId, selectedDate, nextIsClosed);
      setAvailability((prev) => ({
        ...prev,
        closedDays: {
          ...prev.closedDays,
          [selectedDate]: nextIsClosed,
        },
      }));
      toast.success(nextIsClosed ? "Day closed." : "Day opened.");
    } catch (error) {
      console.error("Failed to update day:", error);
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleSlotToggle = async (time: string) => {
    if (!selectedPsychologistId) return;

    const key = timeKey(time);
    const nextIsClosed = !availability.closedSlots[selectedDate]?.[key];

    try {
      await setClosedSlot(selectedPsychologistId, selectedDate, time, nextIsClosed);
      setAvailability((prev) => ({
        ...prev,
        closedSlots: {
          ...prev.closedSlots,
          [selectedDate]: {
            ...(prev.closedSlots[selectedDate] || {}),
            [key]: nextIsClosed,
          },
        },
      }));
    } catch (error) {
      console.error("Failed to update time:", error);
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const filteredItems =
    filter === "all"
      ? items
      : items.filter((item) => (item.status || "pending") === filter);

  const selectedDateBookings = useMemo(
    () =>
      items.filter(
        (item) =>
          item.psychologistId === selectedPsychologistId &&
          item.date === selectedDate &&
          item.status !== "cancelled"
      ),
    [items, selectedDate, selectedPsychologistId]
  );

  const isSelectedDayClosed = Boolean(availability.closedDays[selectedDate]);
  const calendarDays = getCalendarDays(calendarMonth);
  const todayKey = today();
  const selectedPsychologist =
    psychologists.find((item) => item.id === selectedPsychologistId) || null;

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Bookings</h1>
          <p>Manage client appointments</p>
        </div>

        <div className={css.filters}>
          {["all", "pending", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={filter === status ? css.activeFilter : css.filterBtn}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <section className={css.availability}>
        <div className={css.availabilityHeader}>
          <div>
            <h2>Availability</h2>
            <p>Close full days or individual times for booking.</p>
          </div>

          <button
            className={
              isSelectedDayClosed ? css.openDayBtn : css.closeDayBtn
            }
            onClick={handleDayToggle}
            disabled={!selectedPsychologistId || availabilityLoading}
          >
            {isSelectedDayClosed ? "Open day" : "Close day"}
          </button>
        </div>

        <div className={css.availabilityControls}>
          <label className={css.customSelect} ref={psychologistSelectRef}>
            Psychologist
            <button
              type="button"
              className={css.selectButton}
              onClick={() => {
                setIsPsychologistOpen((isOpen) => !isOpen);
                setIsDateOpen(false);
              }}
              aria-expanded={isPsychologistOpen}
            >
              <span>{selectedPsychologist?.name || "Select psychologist"}</span>
              <LuChevronDown className={css.selectIcon} />
            </button>

            {isPsychologistOpen && (
              <div className={css.selectDropdown}>
                {psychologists.map((psychologist) => {
                  const isSelected = psychologist.id === selectedPsychologistId;

                  return (
                    <button
                      key={psychologist.id}
                      type="button"
                      className={
                        isSelected ? css.selectOptionActive : css.selectOption
                      }
                      onClick={() => {
                        setSelectedPsychologistId(psychologist.id);
                        setIsPsychologistOpen(false);
                      }}
                    >
                      <span>{psychologist.name}</span>
                      {isSelected && <LuCheck className={css.optionCheck} />}
                    </button>
                  );
                })}
              </div>
            )}
          </label>

          <label className={css.datePicker} ref={datePickerRef}>
            Date
            <button
              type="button"
              className={css.dateButton}
              onClick={handleDateOpen}
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
                    const isPast = dateKey < todayKey;
                    const isSelected = dateKey === selectedDate;
                    const isClosed = Boolean(availability.closedDays[dateKey]);

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        className={
                          [
                            css.calendarDay,
                            isOutsideMonth ? css.calendarDayMuted : "",
                            isSelected ? css.calendarDaySelected : "",
                            isClosed ? css.calendarDayClosed : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
                        disabled={isPast}
                        title={isClosed ? "Closed day" : undefined}
                        onClick={() => {
                          setSelectedDate(dateKey);
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
          </label>
        </div>

        <div className={css.slotGrid}>
          {TIMES.map((time) => {
            const booking = selectedDateBookings.find(
              (item) => normalizeTime(item.time) === time
            );
            const isClosed = Boolean(
              availability.closedSlots[selectedDate]?.[timeKey(time)]
            );

            return (
              <button
                key={time}
                type="button"
                className={
                  booking
                    ? css.bookedSlot
                    : isClosed
                      ? css.closedSlot
                      : css.openSlot
                }
                onClick={() => !booking && handleSlotToggle(time)}
                disabled={Boolean(booking) || isSelectedDayClosed}
                title={booking ? `Booked by ${booking.name}` : undefined}
              >
                <span>{time}</span>
                <small>
                  {booking ? "Booked" : isClosed ? "Closed" : "Open"}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <div className={css.list}>
        {filteredItems.map((item) => {
          const currentStatus = item.status || "pending";

          return (
            <div key={item.id} className={css.card}>
              <div className={css.info}>
                <div className={css.headerRow}>
                  <h3>{item.name}</h3>

                  <span className={css[currentStatus]}>{currentStatus}</span>
                </div>

                <div className={css.meta}>
                  <span>{item.email}</span>
                  <span>{item.phone}</span>
                </div>

                <p>
                  <strong>Psychologist:</strong> {item.psychologistName}
                </p>

                <p>
                  <strong>Date:</strong> {item.date} at{" "}
                  {normalizeTime(item.time)}
                </p>

                {item.comment && (
                  <p className={css.comment}>
                    <strong>Comment:</strong> {item.comment}
                  </p>
                )}
              </div>

              <div className={css.actions}>
                <button
                  onClick={() => changeStatus(item.id, "confirmed")}
                  className={css.confirmBtn}
                  disabled={currentStatus === "confirmed"}
                >
                  Confirm
                </button>

                <button
                  onClick={() => changeStatus(item.id, "cancelled")}
                  className={css.cancelBtn}
                  disabled={currentStatus === "cancelled"}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
