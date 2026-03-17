// frontend/src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, RegisterDto } from "../types";
import api from "../services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        const { access_token, user } = response.data;

        localStorage.setItem("token", access_token);
        set({ user, token: access_token, isAuthenticated: true });
      },

      register: async (data: RegisterDto) => {
        console.log("🔵 REGISTER ATTEMPT - Step 1: Function called");
        console.log("🔵 Data being sent:", data);
        try {
          console.log(
            "🔵 Step 2: Making API call to:",
            `${api.defaults.baseURL}/auth/register`,
          );
          const response = await api.post("/auth/register", data);
          console.log("🔵 Step 3: Response received:", response.data);

          const { access_token, user } = response.data;

          localStorage.setItem("token", access_token);
          localStorage.setItem("user", JSON.stringify(user));
          api.defaults.headers.common["Authorization"] =
            `Bearer ${access_token}`;

          console.log("🔵 Step 4: Registration successful, user stored");
          set({ user, token: access_token, isAuthenticated: true });
        } catch (error) {
          console.log("🔴 Step 3: ERROR - Request failed");
          console.log("🔴 Error details:", error);
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr) as User;
            set({
              isAuthenticated: true,
              isLoading: false,
              token,
              user,
            });
          } catch {
            localStorage.removeItem("user");
            set({ isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
