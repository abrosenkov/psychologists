import { db } from "@/lib/firebase";
import { ref, push, set, get, query, orderByChild, equalTo } from "firebase/database";

interface Appointment {
  time: string;
  date: string;
  psychologistId: string;
  userId: string;
  createdAt: number;
}


export const createAppointment = async (
  userId: string,
  data: Record<string, unknown>
) => {

  const appointmentsRef = ref(db, "appointments");
  const newRef = push(appointmentsRef);

  await set(newRef, {
    ...data,
    userId,
    createdAt: Date.now(),
  });
};


export const getBusySlots = async (psychologistId: string) => {
  const appointmentsRef = ref(db, "appointments");
  

  const appointmentsQuery = query(
    appointmentsRef,
    orderByChild("psychologistId"),
    equalTo(psychologistId)
  );

  const snapshot = await get(appointmentsQuery);

  if (snapshot.exists()) {
    const data = snapshot.val() as Record<string, Appointment>;

    return Object.values(data).map((app: Appointment) => ({
      time: app.time,
      date: app.date,
    }));
  }

  return [];
};