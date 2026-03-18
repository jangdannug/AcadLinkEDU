import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// UI store for transient UI state (notifications/snackbars)
import { create as createStore } from 'zustand';

export const useUIStore = createStore((set) => ({
  notification: null, // { id, message, type }
  showNotification: (message, type = 'error', duration = 5000) => {
    const id = Date.now();
    set({ notification: { id, message, type } });
    if (duration > 0) {
      setTimeout(() => {
        set({ notification: null });
      }, duration);
    }
  },
  clearNotification: () => set({ notification: null }),
}));
