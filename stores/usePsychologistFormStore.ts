import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PsychologistFormDraft {
  name: string;
  avatar_url: string;
  specialization: string;
  price_per_hour: string;
}

interface PsychologistFormState {
  draft: PsychologistFormDraft;
  setDraft: (draft: Partial<PsychologistFormDraft>) => void;
  clearDraft: () => void;
}

export const initialPsychologistFormDraft: PsychologistFormDraft = {
  name: "",
  avatar_url: "",
  specialization: "",
  price_per_hour: "",
};

export const usePsychologistFormStore = create<PsychologistFormState>()(
  persist(
    (set) => ({
      draft: initialPsychologistFormDraft,

      setDraft: (newDraft) =>
        set((state) => ({ draft: { ...state.draft, ...newDraft } })),

      clearDraft: () => set({ draft: initialPsychologistFormDraft }),
    }),
    {
      name: "psychologist-form-storage",
      partialize: (state) => ({ draft: state.draft }),
    }
  )
);
