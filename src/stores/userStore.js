import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => {
    console.log('UserStore: Setting user:', user);
    set({ user });
  },
  clearUser: () => {
    console.log('UserStore: Clearing user');
    set({ user: null });
  }
}));
