import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Auth
      token:        null,
      currentUser:  null,
      activeChild:  null,   // child object when adult is browsing

      setAuth:      (token, user) => set({ token, currentUser: user }),
      setChild:     (child)       => set({ activeChild: child }),
      logout:       ()            => set({ token: null, currentUser: null, activeChild: null }),

      // Child mode: which module is active
      activeModule: 'phrases',  // 'phrases' | 'schedule' | 'emotion'
      setModule:    (m)          => set({ activeModule: m }),
    }),
    { name: 'caa-tea-store', partialize: (s) => ({ token: s.token, currentUser: s.currentUser }) }
  )
);
