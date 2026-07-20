import { createContext, ReactNode, useContext, useState } from "react";
import { STAFF_STORAGE_KEY, TOKEN_STORAGE_KEY } from "../api/client";
import { AuthStaff, authApi } from "./authApi";

interface AuthContextValue {
  staff: AuthStaff | null;
  login: (pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Temporary escape hatch while staff PINs can't be tested (no database yet). Set
// VITE_DISABLE_AUTH=true in frontend/.env to skip the login screen entirely; unset it
// once the database is seeded with real staff (must match backend's DISABLE_AUTH).
const AUTH_DISABLED = import.meta.env.VITE_DISABLE_AUTH === "true";
const DEV_BYPASS_STAFF: AuthStaff = { id: "dev-bypass", fullName: "Dev (auth disabled)", role: "MANAGEMENT" };

function loadStaff(): AuthStaff | null {
  if (AUTH_DISABLED) return DEV_BYPASS_STAFF;
  const raw = localStorage.getItem(STAFF_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthStaff) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<AuthStaff | null>(loadStaff);

  async function login(pin: string) {
    const { token, staff: loggedInStaff } = await authApi.login(pin);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(loggedInStaff));
    setStaff(loggedInStaff);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(STAFF_STORAGE_KEY);
    setStaff(AUTH_DISABLED ? DEV_BYPASS_STAFF : null);
  }

  return <AuthContext.Provider value={{ staff, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
