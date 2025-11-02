import { type StateCreator } from "zustand";

import type { User } from "@/types";

export type State = {
  user: User;
  isAuthenticated: boolean;
};

export type Actions = {
  setUser: (user: User) => void;
  clearUser: () => void;
};

export type AuthSlice = State & Actions;

const defaultValue: User = {
  id: "",
  name: "",
  email: "",
  createdAt: new Date(),
};

export const createAuthSlice: StateCreator<
  any,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set) => ({
  user: defaultValue,
  setUser: (user: User) => set((state: any) => {
    state.user = user;
    state.isAuthenticated = true;
  }),
  clearUser: () => set((state: any) => {
    state.user = defaultValue;
    state.isAuthenticated = false;
  }),
  isAuthenticated: false,
});
