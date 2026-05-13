"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref, remove, update } from "firebase/database";
import toast from "react-hot-toast";
import {
  LuCalendar,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import Loader from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import {
  getAvailability,
  isPastSlot,
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
  userId?: string;
  name: string;
  email: string;
  phone: string;
  userPhotoURL?: string;
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

const isPastBooking = (booking: Pick<Booking, "date" | "time">) => {
  return isPastSlot(booking.date, booking.time);
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

const getInitial = (name?: string, email?: string) =>
  (name?.trim()[0] || email?.trim()[0] || "U").toUpperCase();

function ClientAvatar({ booking }: { booking: Booking }) {
  if (booking.userPhotoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={css.clientAvatar}
        src={booking.userPhotoURL}
        alt={booking.name || "Client"}
      />
    );
  }

  return (
    <div className={css.clientAvatar}>
      {getInitial(booking.name, booking.email)}
    </div>
  );
}

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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const psychologistSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (!selectedPsychologistId) return;

    loadAvailability(selectedPsychologistId);
  }, [selectedPsychologistId]);

  useEffect(() => {
    if (!isDateOpen && !isPsychologistOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
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

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isDateOpen, isPsychologistOpen]);

  const handleDateOpen = () => {
    const date = parseDateKey(selectedDate) ?? new Date();

    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setIsDateOpen((isOpen) => !isOpen);
    setIsPsychologistOpen(false);
  };

  const loadBookings = async () => {
    try {
      const [appointmentsSnap, psychologistsSnap, usersSnap] = await Promise.all([
        get(ref(db, "appointments")),
        get(ref(db, "psychologists")),
        get(ref(db, "users")),
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
      const usersData = usersSnap.exists()
        ? (usersSnap.val() as Record<string, { photoURL?: string }>)
        : {};

      const list = Object.entries(appointmentsData).map(([id, value]) => {
        const booking = value;
        const userPhotoURL = booking.userId
          ? usersData[booking.userId]?.photoURL
          : undefined;

        return {
          id,
          ...booking,
          userPhotoURL,
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
    setSelectedBooking((current) =>
      current?.id === id ? { ...current, status } : current
    );
  };

  const requestDeleteBooking = (booking: Booking) => {
    setSelectedBooking(null);
    setBookingToDelete(booking);
  };

  const deleteBooking = async () => {
    if (!bookingToDelete) return;

    setIsDeleting(true);

    try {
      await remove(ref(db, `appointments/${bookingToDelete.id}`));

      setItems((prev) =>
        prev.filter((item) => item.id !== bookingToDelete.id)
      );
      setSelectedBooking((current) =>
        current?.id === bookingToDelete.id ? null : current
      );
      setBookingToDelete(null);
      toast.success("Booking deleted.");
    } catch (error) {
      console.error("Failed to delete booking:", error);
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
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
          <div className={css.customSelect} ref={psychologistSelectRef}>
            <span className={css.controlLabel}>Psychologist</span>
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
          </div>

          <div className={css.datePicker} ref={datePickerRef}>
            <span className={css.controlLabel}>Date</span>
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
                            isPast ? css.calendarDayPast : "",
                            isSelected ? css.calendarDaySelected : "",
                            isClosed ? css.calendarDayClosed : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
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
          </div>
        </div>

        <div className={css.slotGrid}>
          {TIMES.map((time) => {
            const booking = selectedDateBookings.find(
              (item) => normalizeTime(item.time) === time
            );
            const isClosed = Boolean(
              availability.closedSlots[selectedDate]?.[timeKey(time)]
            );
            const isPast = isPastSlot(selectedDate, time);
            const isUnavailablePastSlot = isPast && !booking;

            return (
              <button
                key={time}
                type="button"
                className={[
                  booking
                    ? css.bookedSlot
                    : isUnavailablePastSlot
                      ? css.pastSlot
                      : isClosed
                        ? css.closedSlot
                        : css.openSlot,
                  booking && isPast ? css.pastBookedSlot : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  booking
                    ? setSelectedBooking(booking)
                    : handleSlotToggle(time)
                }
                disabled={!booking && (isSelectedDayClosed || isPast)}
                title={
                  booking
                    ? `View booking for ${booking.name}`
                    : isPast
                      ? "This time has already passed"
                    : isSelectedDayClosed
                      ? "Day is closed"
                      : undefined
                }
              >
                <span>{time}</span>
                <small>
                  {booking
                    ? isPast
                      ? "Past booked"
                      : "Booked"
                    : isPast
                      ? "Past"
                      : isClosed
                        ? "Closed"
                        : "Open"}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <Modal
        isOpen={Boolean(selectedBooking)}
        onCloseModal={() => setSelectedBooking(null)}
      >
        {selectedBooking && (
          <div className={css.bookingModal}>
            <div className={css.bookingModalHeader}>
              <div className={css.bookingTitle}>
                <ClientAvatar booking={selectedBooking} />
                <div>
                  <span className={css.modalEyebrow}>Booking details</span>
                  <h2>{selectedBooking.name}</h2>
                </div>
              </div>
              <span className={css[selectedBooking.status || "pending"]}>
                {selectedBooking.status || "pending"}
              </span>
            </div>

            {isPastBooking(selectedBooking) && (
              <div className={css.pastNotice}>
                This booking time has already passed.
              </div>
            )}

            <div className={css.detailGrid}>
              <div>
                <span>Psychologist</span>
                <strong>{selectedBooking.psychologistName}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>
                  {selectedBooking.date} at {normalizeTime(selectedBooking.time)}
                </strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedBooking.email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedBooking.phone}</strong>
              </div>
            </div>

            {selectedBooking.comment && (
              <div className={css.modalComment}>
                <span>Comment</span>
                <p>{selectedBooking.comment}</p>
              </div>
            )}

            <div className={css.modalActions}>
              <button
                type="button"
                className={css.confirmBtn}
                onClick={() => changeStatus(selectedBooking.id, "confirmed")}
                disabled={selectedBooking.status === "confirmed"}
              >
                Confirm
              </button>
              <button
                type="button"
                className={css.cancelBtn}
                onClick={() => changeStatus(selectedBooking.id, "cancelled")}
                disabled={selectedBooking.status === "cancelled"}
              >
                Cancel booking
              </button>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={() => requestDeleteBooking(selectedBooking)}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(bookingToDelete)}
        onCloseModal={() => !isDeleting && setBookingToDelete(null)}
      >
        {bookingToDelete && (
          <div className={css.confirmModal}>
            <h2>Delete booking?</h2>
            <p>
              This will permanently remove the booking for{" "}
              <strong>{bookingToDelete.name}</strong> on {bookingToDelete.date}{" "}
              at {normalizeTime(bookingToDelete.time)}.
            </p>

            <div className={css.modalActions}>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={deleteBooking}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                className={css.cancelSecondaryBtn}
                onClick={() => setBookingToDelete(null)}
                disabled={isDeleting}
              >
                Keep booking
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className={css.list}>
        {filteredItems.map((item) => {
          const currentStatus = item.status || "pending";
          const isPast = isPastBooking(item);

          return (
            <div
              key={item.id}
              className={[css.card, isPast ? css.pastCard : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={css.info}>
                <div className={css.headerRow}>
                  <div className={css.clientTitle}>
                    <ClientAvatar booking={item} />
                    <h3>{item.name}</h3>
                  </div>

                  <div className={css.statusGroup}>
                    {isPast && <span className={css.pastBadge}>Past</span>}
                    <span className={css[currentStatus]}>{currentStatus}</span>
                  </div>
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

                <button
                  type="button"
                  onClick={() => requestDeleteBooking(item)}
                  className={css.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
