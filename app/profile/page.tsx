"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { equalTo, get, orderByChild, query, ref, update } from "firebase/database";
import toast from "react-hot-toast";
import Loader from "@/components/Loader/Loader";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/useAuthStore";
import css from "./page.module.css";

interface UserAppointment {
  id: string;
  psychologistId: string;
  psychologistName: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  comment?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: number;
}

const statusLabels: Record<UserAppointment["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);

  const [appointments, setAppointments] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.replace("/");
    }
  }, [loadingAuth, router, user]);

  useEffect(() => {
    if (!user) return;

    const loadAppointments = async () => {
      setLoading(true);

      try {
        const appointmentsQuery = query(
          ref(db, "appointments"),
          orderByChild("userId"),
          equalTo(user.uid)
        );

        const [appointmentsSnapshot, psychologistsSnapshot] = await Promise.all([
          get(appointmentsQuery),
          get(ref(db, "psychologists")),
        ]);

        const psychologists = psychologistsSnapshot.exists()
          ? (psychologistsSnapshot.val() as Record<string, { name?: string }>)
          : {};

        if (!appointmentsSnapshot.exists()) {
          setAppointments([]);
          return;
        }

        const data = appointmentsSnapshot.val() as Record<
          string,
          Omit<UserAppointment, "id" | "psychologistName">
        >;

        const nextAppointments = Object.entries(data)
          .map(([id, appointment]) => ({
            ...appointment,
            id,
            status: appointment.status || "pending",
            psychologistName:
              psychologists[appointment.psychologistId]?.name || "Unknown specialist",
          }))
          .sort((a, b) => {
            const byDate = b.date.localeCompare(a.date);
            return byDate || b.time.localeCompare(a.time);
          });

        setAppointments(nextAppointments);
      } catch {
        toast.error("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user]);

  const activeCount = useMemo(
    () =>
      appointments.filter(
        (appointment) => appointment.status !== "cancelled"
      ).length,
    [appointments]
  );

  const cancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId);

    try {
      await update(ref(db, `appointments/${appointmentId}`), {
        status: "cancelled",
      });

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled" }
            : appointment
        )
      );
      toast.success("Appointment cancelled.");
    } catch {
      toast.error("Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loadingAuth || !user) {
    return (
      <main className={css.page}>
        <Loader />
      </main>
    );
  }

  return (
    <main className={css.page}>
      <div className="container">
        <div className={css.header}>
          <div>
            <p className={css.eyebrow}>Personal area</p>
            <h1>Profile</h1>
          </div>
          <div className={css.avatar}>
            {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
          </div>
        </div>

        <section className={css.summary}>
          <div className={css.accountCard}>
            <span>Account</span>
            <strong>{user.displayName || "User"}</strong>
            <p>{user.email}</p>
          </div>

          <div className={css.statCard}>
            <span>Active appointments</span>
            <strong>{activeCount}</strong>
          </div>

          <div className={css.statCard}>
            <span>Total requests</span>
            <strong>{appointments.length}</strong>
          </div>
        </section>

        <section className={css.appointmentsSection}>
          <div className={css.sectionHeader}>
            <h2>Appointments</h2>
            <p>Track requests and cancel appointments before they are completed.</p>
          </div>

          {loading ? (
            <Loader />
          ) : appointments.length === 0 ? (
            <div className={css.emptyState}>
              You do not have appointment requests yet.
            </div>
          ) : (
            <div className={css.appointmentList}>
              {appointments.map((appointment) => {
                const canCancel = appointment.status !== "cancelled";

                return (
                  <article key={appointment.id} className={css.appointmentCard}>
                    <div className={css.appointmentMain}>
                      <div>
                        <h3>{appointment.psychologistName}</h3>
                        <p>
                          {formatDate(appointment.date)} at {appointment.time}
                        </p>
                      </div>
                      <span className={css[appointment.status]}>
                        {statusLabels[appointment.status]}
                      </span>
                    </div>

                    <div className={css.details}>
                      <span>{appointment.name}</span>
                      <span>{appointment.phone}</span>
                      <span>{appointment.email}</span>
                    </div>

                    {appointment.comment && (
                      <p className={css.comment}>{appointment.comment}</p>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        className={css.cancelBtn}
                        onClick={() => cancelAppointment(appointment.id)}
                        disabled={cancellingId === appointment.id}
                      >
                        {cancellingId === appointment.id
                          ? "Cancelling..."
                          : "Cancel appointment"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
