import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      token:        null,
      currentUser:  null,
      activeChild:  null,    // child object when adult is browsing

      // Cuando el niño pulsa "Ayuda adulto", guardamos su sesión aquí
      // para restaurarla cuando el adulto cierre sesión.
      pendingChildSession: null, // { token, user }

      // Inicio de sesión: guarda token+user
      setAuth:   (token, user) => set({ token, currentUser: user }),
      setChild:  (child)        => set({ activeChild: child }),
      logout:    ()             => set({ token: null, currentUser: null, activeChild: null }),

      // Niño pide ayuda → guarda su sesión y borra la actual (PinGate hará setAuth con el adulto).
      stashChildSession: () => {
        const { token, currentUser } = get();
        if (token && currentUser?.role === 'child') {
          set({ pendingChildSession: { token, user: currentUser } });
        }
      },
      // Adulto vuelve → restaura la sesión del niño si existe.
      // Devuelve true si hubo restauración.
      restoreChildSession: () => {
        const pending = get().pendingChildSession;
        if (pending?.token && pending?.user) {
          set({
            token: pending.token,
            currentUser: pending.user,
            activeChild: null,
            pendingChildSession: null,
          });
          return true;
        }
        set({ token: null, currentUser: null, activeChild: null });
        return false;
      },

      // Progreso del niño cacheado del backend
      progress: { total_stars: 0, level: 1, streak_days: 0, next_threshold: 25 },
      setProgress: (p) => p && set({ progress: p }),

      // Modulo activo en ChildApp
      activeModule: 'phrases',
      setModule:    (m) => set({ activeModule: m }),
    }),
    {
      name: 'caa-tea-store',
      partialize: (s) => ({
        token: s.token,
        currentUser: s.currentUser,
        pendingChildSession: s.pendingChildSession,
        progress: s.progress,
      }),
    }
  )
);
