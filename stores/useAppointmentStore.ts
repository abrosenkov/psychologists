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
  time: string;
  comment: string;
}

interface AppointmentState {
  appointments: Appointment[];
  draft: Draft;

  addAppointment: (app: Appointment) => void;
  setAppointments: (apps: Appointment[]) => void;
  setDraft: (draft: Partial<Draft>) => void;
  clearDraft: () => void;
}

const initialDraft: Draft = { name: "", email: "", phone: "+380", time: "", comment: "" };

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set) => ({
      appointments: [],
      draft: initialDraft,
      
      addAppointment: (app) => 
        set((s) => ({ appointments: [...s.appointments, app] })),

      setAppointments: (apps) => 
        set({ appointments: apps }),

      setDraft: (newDraft) => 
        set((s) => ({ draft: { ...s.draft, ...newDraft } })),

      clearDraft: () =>
        set({ draft: initialDraft }),
    }),
    
    { 
        name: "appointments-storage",
        
      partialize: (state) => ({ draft: state.draft }), 
    }
  )
);