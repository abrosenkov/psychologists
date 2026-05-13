import { create } from "zustand";
import { User } from "firebase/auth";

interface AuthState {
  user: User | null;
  profilePhotoURL: string | null;
  role: "admin" | "user" | null;
  loading: boolean;

  setUser: (user: User | null) => void;
  setProfilePhotoURL: (photoURL: string | null) => void;
  setRole: (role: "admin" | "user" | null) => void;

  setLoading: (loading: boolean) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profilePhotoURL: null,
  role: null,
  loading: true,

  setUser: (user) =>
  set({
    user,
    profilePhotoURL: user?.photoURL || null,
  }),

  setProfilePhotoURL: (photoURL) =>
    set({
      profilePhotoURL: photoURL,
    }),

  setRole: (role) =>
    set({
      role,
    }),

  setLoading: (loading) =>
    set({
      loading,
    }),

  logout: () =>
    set({
      user: null,
      profilePhotoURL: null,
      role: null,
      loading: false,
    }),
}));
