"use client";

import { useEffect, useMemo, useState } from "react";
import { get, ref, update } from "firebase/database";
import toast from "react-hot-toast";
import Loader from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/useAuthStore";
import css from "./page.module.css";

type UserRole = "admin" | "user";
type AppointmentStatus = "pending" | "confirmed" | "cancelled";
type ReviewStatus = "pending" | "approved" | "rejected";
type UserSort = "newest" | "oldest" | "name" | "appointments" | "reviews";
type RoleFilter = "all" | UserRole;

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string | null;
  role: UserRole;
  createdAt?: number;
}

interface UserAppointment {
  id: string;
  userId?: string;
  psychologistId?: string;
  psychologistName: string;
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  status: AppointmentStatus;
  createdAt?: number;
}

interface UserReview {
  id: string;
  psychologistId: string;
  psychologistName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt?: number;
}

interface UserRow extends UserProfile {
  appointments: UserAppointment[];
  reviews: UserReview[];
}

const SORT_OPTIONS: { value: UserSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A-Z" },
  { value: "appointments", label: "Most bookings" },
  { value: "reviews", label: "Most reviews" },
];

const formatDateTime = (value?: number) => {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getInitial = (user: Pick<UserProfile, "name" | "email">) =>
  (user.name?.trim()[0] || user.email?.trim()[0] || "U").toUpperCase();

function UserAvatar({ user }: { user: UserProfile }) {
  if (user.photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={css.avatar} src={user.photoURL} alt={user.name || "User"} />
    );
  }

  return <div className={css.avatar}>{getInitial(user)}</div>;
}

export default function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<UserSort>("newest");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const [usersSnap, appointmentsSnap, psychologistsSnap] =
        await Promise.all([
          get(ref(db, "users")),
          get(ref(db, "appointments")),
          get(ref(db, "psychologists")),
        ]);

      const usersData = usersSnap.exists()
        ? (usersSnap.val() as Record<
            string,
            Omit<UserProfile, "id" | "role"> & { role?: UserRole }
          >)
        : {};
      const appointmentsData = appointmentsSnap.exists()
        ? (appointmentsSnap.val() as Record<
            string,
            Omit<UserAppointment, "id" | "psychologistName" | "status"> & {
              status?: AppointmentStatus;
            }
          >)
        : {};
      const psychologistsData = psychologistsSnap.exists()
        ? (psychologistsSnap.val() as Record<
            string,
            {
              name?: string;
              reviews?: Record<
                string,
                {
                  userId?: string;
                  rating?: number;
                  text?: string;
                  comment?: string;
                  status?: ReviewStatus;
                  createdAt?: number;
                }
              >;
            }
          >)
        : {};

      const appointmentsByUser = Object.entries(appointmentsData).reduce<
        Record<string, UserAppointment[]>
      >((acc, [id, appointment]) => {
        if (!appointment.userId) return acc;

        const nextAppointment: UserAppointment = {
          ...appointment,
          id,
          psychologistName:
            psychologistsData[appointment.psychologistId || ""]?.name ||
            "Unknown specialist",
          status: appointment.status || "pending",
        };

        acc[appointment.userId] = [
          ...(acc[appointment.userId] || []),
          nextAppointment,
        ];

        return acc;
      }, {});

      const reviewsByUser: Record<string, UserReview[]> = {};

      Object.entries(psychologistsData).forEach(
        ([psychologistId, psychologist]) => {
          Object.entries(psychologist.reviews || {}).forEach(([id, review]) => {
            if (!review.userId) return;

            reviewsByUser[review.userId] = [
              ...(reviewsByUser[review.userId] || []),
              {
                id,
                psychologistId,
                psychologistName: psychologist.name || "Unknown specialist",
                rating: review.rating || 5,
                text: review.text || review.comment || "",
                status: review.status || "approved",
                createdAt: review.createdAt,
              },
            ];
          });
        }
      );

      const nextItems = Object.entries(usersData).map(([id, user]) => ({
        id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || "user",
        createdAt: user.createdAt,
        appointments: (appointmentsByUser[id] || []).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        ),
        reviews: (reviewsByUser[id] || []).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        ),
      }));

      setItems(nextItems);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        if (roleFilter !== "all" && item.role !== roleFilter) return false;
        if (!normalizedQuery) return true;

        return [item.name, item.email, item.role]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        switch (sort) {
          case "oldest":
            return (a.createdAt || 0) - (b.createdAt || 0);
          case "name":
            return (a.name || a.email || "").localeCompare(
              b.name || b.email || ""
            );
          case "appointments":
            return b.appointments.length - a.appointments.length;
          case "reviews":
            return b.reviews.length - a.reviews.length;
          case "newest":
          default:
            return (b.createdAt || 0) - (a.createdAt || 0);
        }
      });
  }, [items, query, roleFilter, sort]);

  const requestDeleteUser = (user: UserRow) => {
    if (user.id === currentUser?.uid) {
      toast.error("You cannot delete your own admin profile.");
      return;
    }

    if (user.role === "admin") {
      toast.error("Admin users are protected from this action.");
      return;
    }

    setSelectedUser(null);
    setUserToDelete(user);
  };

  const deleteUserData = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);

    try {
      const updates: Record<string, null> = {
        [`users/${userToDelete.id}`]: null,
        [`favorites/${userToDelete.id}`]: null,
      };

      userToDelete.appointments.forEach((appointment) => {
        updates[`appointments/${appointment.id}`] = null;
      });

      userToDelete.reviews.forEach((review) => {
        updates[`psychologists/${review.psychologistId}/reviews/${review.id}`] =
          null;
      });

      await update(ref(db), updates);

      setItems((prev) => prev.filter((item) => item.id !== userToDelete.id));
      setUserToDelete(null);
      toast.success("User database records deleted.");
    } catch {
      toast.error("Failed to delete user records.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Users</h1>
          <p>Manage registered clients and their activity</p>
        </div>
      </div>

      <section className={css.controls} aria-label="User filters">
        <label className={css.searchBox}>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, role"
          />
        </label>

        <label className={css.controlField}>
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as UserSort)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={css.filterGroup}>
          <span>Role</span>
          <div className={css.statusFilters}>
            {(["all", "user", "admin"] as RoleFilter[]).map((role) => (
              <button
                key={role}
                type="button"
                className={roleFilter === role ? css.activeFilter : css.filterBtn}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={css.list}>
        {visibleItems.length === 0 && (
          <div className={css.emptyState}>No users match these filters.</div>
        )}

        {visibleItems.map((item) => (
          <article key={item.id} className={css.card}>
            <div className={css.info}>
              <div className={css.headerRow}>
                <div className={css.userTitle}>
                  <UserAvatar user={item} />
                  <div>
                    <h3>{item.name || "Unnamed user"}</h3>
                    <p>{item.email || "No email"}</p>
                  </div>
                </div>
                <span className={item.role === "admin" ? css.admin : css.user}>
                  {item.role}
                </span>
              </div>

              <div className={css.meta}>
                <span>Registered: {formatDateTime(item.createdAt)}</span>
                <span>Bookings: {item.appointments.length}</span>
                <span>Reviews: {item.reviews.length}</span>
              </div>
            </div>

            <div className={css.actions}>
              <button
                type="button"
                className={css.viewBtn}
                onClick={() => setSelectedUser(item)}
              >
                View details
              </button>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={() => requestDeleteUser(item)}
                disabled={item.id === currentUser?.uid || item.role === "admin"}
              >
                Delete data
              </button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selectedUser)}
        onCloseModal={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <div className={css.detailsModal}>
            <div className={css.detailsHeader}>
              <UserAvatar user={selectedUser} />
              <div>
                <span className={css.modalEyebrow}>User profile</span>
                <h2>{selectedUser.name || "Unnamed user"}</h2>
                <p>{selectedUser.email || "No email"}</p>
              </div>
            </div>

            <div className={css.detailsGrid}>
              <div>
                <span>Role</span>
                <strong>{selectedUser.role}</strong>
              </div>
              <div>
                <span>Registered</span>
                <strong>{formatDateTime(selectedUser.createdAt)}</strong>
              </div>
              <div>
                <span>Bookings</span>
                <strong>{selectedUser.appointments.length}</strong>
              </div>
              <div>
                <span>Reviews</span>
                <strong>{selectedUser.reviews.length}</strong>
              </div>
            </div>

            <section className={css.activitySection}>
              <h3>Bookings</h3>
              {selectedUser.appointments.length === 0 ? (
                <p className={css.muted}>No bookings yet.</p>
              ) : (
                <div className={css.activityList}>
                  {selectedUser.appointments.map((appointment) => (
                    <div key={appointment.id} className={css.activityItem}>
                      <div>
                        <strong>{appointment.psychologistName}</strong>
                        <p>
                          {appointment.date || "No date"} at{" "}
                          {appointment.time || "No time"}
                        </p>
                      </div>
                      <span className={css[appointment.status]}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={css.activitySection}>
              <h3>Reviews</h3>
              {selectedUser.reviews.length === 0 ? (
                <p className={css.muted}>No reviews yet.</p>
              ) : (
                <div className={css.activityList}>
                  {selectedUser.reviews.map((review) => (
                    <div key={review.id} className={css.activityItem}>
                      <div>
                        <strong>{review.psychologistName}</strong>
                        <p>
                          {review.rating}/5
                          {review.text ? ` - ${review.text}` : ""}
                        </p>
                      </div>
                      <span className={css[review.status]}>{review.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className={css.modalActions}>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={() => requestDeleteUser(selectedUser)}
                disabled={
                  selectedUser.id === currentUser?.uid ||
                  selectedUser.role === "admin"
                }
              >
                Delete user data
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(userToDelete)}
        onCloseModal={() => !isDeleting && setUserToDelete(null)}
      >
        {userToDelete && (
          <div className={css.confirmModal}>
            <h2>Delete user data?</h2>
            <p>
              This removes the database profile, favorites, bookings, and reviews
              for <strong>{userToDelete.name || userToDelete.email}</strong>.
              The Firebase Auth account is not deleted from the client app.
            </p>

            <div className={css.modalActions}>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={deleteUserData}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete data"}
              </button>
              <button
                type="button"
                className={css.cancelBtn}
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
