import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { createAuthSlice, type AuthSlice } from "./authSlice";
import { createCallSlice, type CallSlice } from "./callSlice";

export type BoundStoreType = AuthSlice & CallSlice;

export const useBoundStore = create<BoundStoreType>()(
  immer((...a) => ({
    ...createAuthSlice(...a),
    ...createCallSlice(...a),
  }))
);
