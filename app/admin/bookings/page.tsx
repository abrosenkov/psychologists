"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref, update } from "firebase/database";
import toast from "react-hot-toast";
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

const today = () => new Date().toISOString().split("T")[0];

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
  const [selectedDate, setSelectedDate] = useState(today);
  const [availability, setAvailability] =
    useState<Availability>(initialAvailability);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (!selectedPsychologistId) return;

    loadAvailability(selectedPsychologistId);
  }, [selectedPsychologistId]);

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
          <label>
            Psychologist
            <select
              value={selectedPsychologistId}
              onChange={(event) => setSelectedPsychologistId(event.target.value)}
            >
              {psychologists.map((psychologist) => (
                <option key={psychologist.id} value={psychologist.id}>
                  {psychologist.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              min={today()}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
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
