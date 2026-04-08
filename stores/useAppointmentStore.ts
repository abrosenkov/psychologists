import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Appointment {
  psychologistId: string;
  time: string;
  date: string;
}

interface Draft {
  name: string;
  email: string;
  phone: string;
  time: string; // Добавили время в черновик
  comment: string;
}

interface AppointmentState {
  appointments: Appointment[];
  draft: Draft;
  addAppointment: (app: Appointment) => void;
  setDraft: (draft: Partial<Draft>) => void;
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set) => ({
      appointments: [],
      // Изначальное состояние (тайм пустой, чтобы сработал placeholder)
      draft: { name: "", email: "", phone: "+380", time: "", comment: "" }, 
      addAppointment: (app) => set((s) => ({ appointments: [...s.appointments, app] })),
      setDraft: (newDraft) => set((s) => ({ draft: { ...s.draft, ...newDraft } })),
    }),
    { name: "appointments-storage" }
  )
);