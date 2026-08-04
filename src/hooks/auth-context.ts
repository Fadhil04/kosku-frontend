import { createContext } from "react";
import type { User } from "../types";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    role?: "owner" | "tenant",
  ) => Promise<"owner" | "tenant">;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
