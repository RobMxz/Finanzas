import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import useAppStore from "../store/useAppStore";

export function useTransactions() {
  const { user } = useAppStore();
  const filtrosGuardados = useAppStore((s) => s.filtrosTransacciones);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("transactions")
        .select(
          `
          *,
          category:categories(id, nombre, color, icono, tipo),
          items:transaction_items(id, nombre, cantidad, monto)
        `,
        )
        .eq("user_id", user.id)
        .order("fecha", { ascending: false });

      if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
      if (filtros.category_id)
        query = query.eq("category_id", filtros.category_id);
      if (filtros.fechaDesde) query = query.gte("fecha", filtros.fechaDesde);
      if (filtros.fechaHasta) query = query.lte("fecha", filtros.fechaHasta);

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (datos, items = []) => {
    // Crear la transacción
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...datos, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;

    // Si hay ítems, insertarlos
    if (items.length > 0) {
      const itemsConIds = items.map((item) => ({
        ...item,
        transaction_id: data.id,
        user_id: user.id,
      }));
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(itemsConIds);
      if (itemsError) throw itemsError;
    }

    await fetchTransactions(filtrosGuardados);
  };

  const updateTransaction = async (id, datos, items = []) => {
    const { error } = await supabase
      .from("transactions")
      .update(datos)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    // Eliminar ítems anteriores y reinsertar
    await supabase.from("transaction_items").delete().eq("transaction_id", id);

    if (items.length > 0) {
      const itemsConIds = items.map((item) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        monto: item.monto,
        transaction_id: id,
        user_id: user.id,
      }));
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(itemsConIds);
      if (itemsError) throw itemsError;
    }

    await fetchTransactions(filtrosGuardados);
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchTransactions(filtrosGuardados);
  };

  useEffect(() => {
    if (user) fetchTransactions(filtrosGuardados);
  }, [user]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
