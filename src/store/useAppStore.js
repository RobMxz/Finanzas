import { create } from "zustand";
import { supabase } from "../lib/supabase";

const useAppStore = create((set, get) => ({
  // ── Auth ────────────────────────────────
  user: null,
  session: null,
  loading: true,

  initAuth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, session, loading: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session });
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUp: async (email, password, nombre) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null });
  },

  // ── Filtros de transacciones ─────────────
  filtrosTransacciones: {
    tipo: "",
    fechaDesde: "",
    fechaHasta: "",
  },

  setFiltrosTransacciones: (filtros) =>
    set({
      filtrosTransacciones: { ...get().filtrosTransacciones, ...filtros },
    }),

  limpiarFiltrosTransacciones: () =>
    set({
      filtrosTransacciones: { tipo: "", fechaDesde: "", fechaHasta: "" },
    }),
}));

export default useAppStore;
