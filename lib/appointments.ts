import { db } from "@/lib/firebase";
import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  remove,
} from "firebase/database";

interface Appointment {
  time: string;
  date: string;
  psychologistId: string;
  userId: string;
  createdAt: number;
  status?: "pending" | "confirmed" | "cancelled";
}

export interface BusySlot {
  time: string;
  date: string;
  source: "appointment" | "admin";
}

export interface Availability {
  closedDays: Record<string, boolean>;
  closedSlots: Record<string, Record<string, boolean>>;
}

export const TIMES = [
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

export const normalizeTime = (time: string) => time.replace(/\s/g, "");

export const timeKey = (time: string) => normalizeTime(time).replace(":", "-");

export const getSlotDateTime = (dateKey: string, time: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const isPastSlot = (dateKey: string, time: string) => {
  const slotDateTime = getSlotDateTime(dateKey, time);

  return slotDateTime ? slotDateTime.getTime() <= Date.now() : false;
};

const emptyAvailability: Availability = {
  closedDays: {},
  closedSlots: {},
};

export const createAppointment = async (
  userId: string,
  data: Record<string, unknown>
) => {
  const appointmentsRef = ref(db, "appointments");
  const newRef = push(appointmentsRef);

  await set(newRef, {
    ...data,
    userId,
    status: "pending",
    createdAt: Date.now(),
  });
};

export const getAvailability = async (
  psychologistId: string
): Promise<Availability> => {
  const snapshot = await get(ref(db, `availability/${psychologistId}`));

  if (!snapshot.exists()) return emptyAvailability;

  const data = snapshot.val() as Partial<Availability>;

  return {
    closedDays: data.closedDays || {},
    closedSlots: data.closedSlots || {},
  };
};

export const getBusySlots = async (psychologistId: string) => {
  const appointmentsQuery = query(
    ref(db, "appointments"),
    orderByChild("psychologistId"),
    equalTo(psychologistId)
  );

  const [appointmentsSnapshot, availability] = await Promise.all([
    get(appointmentsQuery),
    getAvailability(psychologistId),
  ]);

  const busySlots: BusySlot[] = [];

  if (appointmentsSnapshot.exists()) {
    const data = appointmentsSnapshot.val() as Record<string, Appointment>;

    busySlots.push(
      ...Object.values(data)
        .filter((app: Appointment) => app.status !== "cancelled")
        .map((app: Appointment) => ({
          time: normalizeTime(app.time),
          date: app.date,
          source: "appointment" as const,
        }))
    );
  }

  Object.entries(availability.closedSlots).forEach(([date, slots]) => {
    Object.entries(slots || {}).forEach(([key, isClosed]) => {
      if (!isClosed) return;

      busySlots.push({
        date,
        time: key.replace("-", ":"),
        source: "admin",
      });
    });
  });

  return busySlots;
};

export const setClosedDay = async (
  psychologistId: string,
  date: string,
  isClosed: boolean
) => {
  const dayRef = ref(db, `availability/${psychologistId}/closedDays/${date}`);

  if (isClosed) {
    await set(dayRef, true);
  } else {
    await remove(dayRef);
  }
};

export const setClosedSlot = async (
  psychologistId: string,
  date: string,
  time: string,
  isClosed: boolean
) => {
  const slotRef = ref(
    db,
    `availability/${psychologistId}/closedSlots/${date}/${timeKey(time)}`
  );

  if (isClosed) {
    await set(slotRef, true);
  } else {
    await remove(slotRef);
  }
};
