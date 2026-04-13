"use client";

import { Button } from "../UI/Button/Button";
import css from "./UserMenu.module.css";
import { useAuthStore } from "@/stores/useAuthStore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAppointmentStore } from "@/stores/useAppointmentStore";

interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const user = useAuthStore((state) => state.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const clearDraft = useAppointmentStore((state) => state.clearDraft);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      await signOut(auth);

      logout();

      clearDraft();
      localStorage.removeItem("appointments-storage");

      onLogout();
      router.push("/");

      toast.success("Logged out successfully 👋");
    } catch {
      toast.error("Failed to log out. Try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className={css.userBlock}>
      <div className={css.userInfo}>
        <div className={css.userAvatar}>
          {user?.displayName?.[0]?.toUpperCase() || "U"}
        </div>
        <span className={css.userName}>{user?.displayName || "User"}</span>
      </div>

      <Button type="button" className={css.logoutBtn} onClick={handleLogout}>
        {isLoggingOut ? "Logging out..." : "Log out"}
      </Button>
    </div>
  );
}
