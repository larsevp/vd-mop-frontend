import { create } from "zustand";

// Simple navigation history store keeping last N internal paths
export const useNavigationHistoryStore = create((set, get) => ({
  stack: [],
  max: 50,
  push: (path) =>
    set((state) => {
      if (!path || typeof path !== "string") return state;
      // Ignore duplicate consecutive entries
      if (state.stack[state.stack.length - 1] === path) return state;
      const next = [...state.stack, path];
      // Trim if exceeds max
      while (next.length > state.max) next.shift();
      return { stack: next };
    }),
  getStack: () => get().stack,
  findRecentMatch: (predicates) => {
    const stack = get().stack;
    for (let i = stack.length - 2; i >= 0; i--) {
      // start before current
      const p = stack[i];
      for (const fn of predicates) {
        if (fn(p)) return p;
      }
    }
    return null;
  },
}));
