"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import Loader from "@/components/Loader/Loader";
import { getSlotDateTime, isPastSlot, normalizeTime } from "@/lib/appointments";
import type { Psychologist } from "@/types/psychologist";
import css from "./page.module.css";

interface AppointmentItem {
  id: string;
  psychologistId: string;
  psychologistName: string;
  name: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: number;
}

interface Stats {
  psychologists: number;
  bookings: number;
  users: number;
  favorites: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  recentBookings: AppointmentItem[];
  upcomingBookings: AppointmentItem[];
  pastBookings: AppointmentItem[];
  incompleteProfiles: Array<Pick<Psychologist, "id" | "name" | "specialization">>;
}

const emptyStats: Stats = {
  psychologists: 0,
  bookings: 0,
  users: 0,
  favorites: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  cancelledBookings: 0,
  pendingReviews: 0,
  approvedReviews: 0,
  rejectedReviews: 0,
  recentBookings: [],
  upcomingBookings: [],
  pastBookings: [],
  incompleteProfiles: [],
};

const statusLabels: Record<AppointmentItem["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const isProfileComplete = (psychologist: Partial<Psychologist>) =>
  Boolean(
    psychologist.name?.trim() &&
      psychologist.specialization?.trim() &&
      psychologist.avatar_url?.trim() &&
      psychologist.experience?.trim() &&
      psychologist.license?.trim() &&
      psychologist.initial_consultation?.trim() &&
      psychologist.about?.trim() &&
      Number.isFinite(Number(psychologist.price_per_hour))
  );

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>(emptyStats);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [psychologistsSnap, bookingsSnap, usersSnap, favoritesSnap] =
        await Promise.all([
          get(ref(db, "psychologists")),
          get(ref(db, "appointments")),
          get(ref(db, "users")),
          get(ref(db, "favorites")),
        ]);

      const psychologistsData = psychologistsSnap.exists()
        ? (psychologistsSnap.val() as Record<
            string,
            Omit<Psychologist, "id">
          >)
        : {};

      const psychologists = Object.keys(psychologistsData).length;
      const psychologistList: Psychologist[] = Object.entries(
        psychologistsData
      ).map(([id, value]) => ({
        id,
        ...value,
      }));

      const appointmentsData = bookingsSnap.exists()
        ? (bookingsSnap.val() as Record<
            string,
            {
              psychologistId: string;
              name?: string;
              date?: string;
              time?: string;
              status?: AppointmentItem["status"];
              createdAt?: number;
            }
          >)
        : {};

      const appointmentList: AppointmentItem[] = Object.entries(
        appointmentsData
      ).map(([id, appointment]) => ({
        id,
        psychologistId: appointment.psychologistId,
        psychologistName:
          psychologistsData[appointment.psychologistId]?.name ||
          "Unknown specialist",
        name: appointment.name || "Anonymous",
        date: appointment.date || "",
        time: appointment.time || "",
        status: appointment.status || "pending",
        createdAt: appointment.createdAt || 0,
      }));

      const bookings = appointmentList.length;
      const activeAppointments = appointmentList.filter(
        (appointment) => appointment.status !== "cancelled"
      );
      const upcomingBookings = activeAppointments
        .filter(
          (appointment) =>
            appointment.date &&
            appointment.time &&
            !isPastSlot(appointment.date, appointment.time)
        )
        .sort((a, b) => {
          const aTime = getSlotDateTime(a.date, a.time)?.getTime() ?? 0;
          const bTime = getSlotDateTime(b.date, b.time)?.getTime() ?? 0;

          return aTime - bTime;
        })
        .slice(0, 5);
      const pastBookings = activeAppointments
        .filter(
          (appointment) =>
            appointment.date &&
            appointment.time &&
            isPastSlot(appointment.date, appointment.time)
        )
        .sort((a, b) => {
          const aTime = getSlotDateTime(a.date, a.time)?.getTime() ?? 0;
          const bTime = getSlotDateTime(b.date, b.time)?.getTime() ?? 0;

          return bTime - aTime;
        })
        .slice(0, 5);
      const incompleteProfiles = psychologistList
        .filter((psychologist) => !isProfileComplete(psychologist))
        .map((psychologist) => ({
          id: psychologist.id,
          name: psychologist.name || "Unnamed psychologist",
          specialization: psychologist.specialization || "No specialization",
        }))
        .slice(0, 5);

      const users = usersSnap.exists()
        ? Object.keys(usersSnap.val()).length
        : 0;

      let favorites = 0;

      if (favoritesSnap.exists()) {
        const data = favoritesSnap.val();

        Object.values(data).forEach((userFavs) => {
          favorites += Object.keys(userFavs as object).length;
        });
      }

      let pendingReviews = 0;
      let approvedReviews = 0;
      let rejectedReviews = 0;

      Object.values(psychologistsData).forEach((psychologist) => {
        Object.values(psychologist.reviews || {}).forEach((review) => {
          const status = review.status || "approved";

          if (status === "pending") pendingReviews += 1;
          else if (status === "rejected") rejectedReviews += 1;
          else approvedReviews += 1;
        });
      });

      setStats({
        psychologists,
        bookings,
        users,
        favorites,
        pendingBookings: appointmentList.filter(
          (appointment) => appointment.status === "pending"
        ).length,
        confirmedBookings: appointmentList.filter(
          (appointment) => appointment.status === "confirmed"
        ).length,
        cancelledBookings: appointmentList.filter(
          (appointment) => appointment.status === "cancelled"
        ).length,
        pendingReviews,
        approvedReviews,
        rejectedReviews,
        upcomingBookings,
        pastBookings,
        incompleteProfiles,
        recentBookings: appointmentList
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Dashboard</h1>
          <p>Operational overview for bookings, reviews, and catalog health</p>
        </div>
      </div>

      <div className={css.grid}>
        <div className={css.card}>
          <span>Total psychologists</span>
          <strong>{stats.psychologists}</strong>
        </div>

        <div className={css.card}>
          <span>Total bookings</span>
          <strong>{stats.bookings}</strong>
        </div>

        <div className={css.card}>
          <span>Total users</span>
          <strong>{stats.users}</strong>
        </div>

        <div className={css.card}>
          <span>Total favorites</span>
          <strong>{stats.favorites}</strong>
        </div>
      </div>

      <div className={css.actionGrid}>
        <section className={css.panel}>
          <div className={css.panelHeader}>
            <div>
              <h2>Upcoming appointments</h2>
              <p>Nearest active bookings that need attention</p>
            </div>
            <Link href="/admin/bookings">Open</Link>
          </div>

          {stats.upcomingBookings.length === 0 ? (
            <div className={css.emptyState}>No upcoming bookings.</div>
          ) : (
            <div className={css.compactList}>
              {stats.upcomingBookings.map((booking) => (
                <article key={booking.id} className={css.compactItem}>
                  <div>
                    <h3>{booking.name}</h3>
                    <p>{booking.psychologistName}</p>
                  </div>
                  <span>
                    {booking.date} {normalizeTime(booking.time)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={css.panel}>
          <div className={css.panelHeader}>
            <div>
              <h2>Past bookings</h2>
              <p>Recent completed time slots still stored in appointments</p>
            </div>
            <Link href="/admin/bookings">Clean up</Link>
          </div>

          {stats.pastBookings.length === 0 ? (
            <div className={css.emptyState}>No past bookings.</div>
          ) : (
            <div className={css.compactList}>
              {stats.pastBookings.map((booking) => (
                <article key={booking.id} className={css.compactItem}>
                  <div>
                    <h3>{booking.name}</h3>
                    <p>{booking.psychologistName}</p>
                  </div>
                  <span>
                    {booking.date} {normalizeTime(booking.time)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={css.panel}>
          <div className={css.panelHeader}>
            <div>
              <h2>Incomplete profiles</h2>
              <p>Psychologist cards missing required public information</p>
            </div>
            <Link href="/admin/psychologists">Fix</Link>
          </div>

          {stats.incompleteProfiles.length === 0 ? (
            <div className={css.emptyState}>All profiles are complete.</div>
          ) : (
            <div className={css.compactList}>
              {stats.incompleteProfiles.map((psychologist) => (
                <article key={psychologist.id} className={css.compactItem}>
                  <div>
                    <h3>{psychologist.name}</h3>
                    <p>{psychologist.specialization}</p>
                  </div>
                  <strong className={css.warningBadge}>Incomplete</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className={css.insightsGrid}>
        <section className={css.panel}>
          <div className={css.panelHeader}>
            <div>
              <h2>Booking pipeline</h2>
              <p>Requests grouped by moderation status</p>
            </div>
            <Link href="/admin/bookings">Manage</Link>
          </div>

          <div className={css.statusRows}>
            {[
              ["Pending", stats.pendingBookings, "pending"],
              ["Confirmed", stats.confirmedBookings, "confirmed"],
              ["Cancelled", stats.cancelledBookings, "cancelled"],
            ].map(([label, value, tone]) => {
              const count = Number(value);
              const width = stats.bookings
                ? Math.max(8, Math.round((count / stats.bookings) * 100))
                : 0;

              return (
                <div key={String(label)} className={css.statusRow}>
                  <div>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className={css.barTrack}>
                    <span
                      className={css[String(tone)]}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={css.panel}>
          <div className={css.panelHeader}>
            <div>
              <h2>Review queue</h2>
              <p>Moderation workload at a glance</p>
            </div>
            <Link href="/admin/reviews">Review</Link>
          </div>

          <div className={css.reviewStats}>
            <div>
              <span>Pending</span>
              <strong>{stats.pendingReviews}</strong>
            </div>
            <div>
              <span>Approved</span>
              <strong>{stats.approvedReviews}</strong>
            </div>
            <div>
              <span>Rejected</span>
              <strong>{stats.rejectedReviews}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className={css.panel}>
        <div className={css.panelHeader}>
          <div>
            <h2>Recent bookings</h2>
            <p>Latest customer requests submitted through the booking flow</p>
          </div>
          <Link href="/admin/bookings">Open bookings</Link>
        </div>

        {stats.recentBookings.length === 0 ? (
          <div className={css.emptyState}>No bookings yet.</div>
        ) : (
          <div className={css.recentList}>
            {stats.recentBookings.map((booking) => (
              <article key={booking.id} className={css.recentItem}>
                <div>
                  <h3>{booking.name}</h3>
                  <p>{booking.psychologistName}</p>
                </div>
                <div className={css.recentMeta}>
                  <span>
                    {booking.date} {booking.time}
                  </span>
                  <strong className={css[booking.status]}>
                    {statusLabels[booking.status]}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
