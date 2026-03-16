import { useState } from "react";
import { supabase } from "../lib/supabase";
import useAppStore from "../store/useAppStore";

export function useBudgets() {
  const { user } = useAppStore();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudgets = async (mes, año) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select(`*, category:categories(id, nombre, color, icono)`)
        .eq("user_id", user.id)
        .eq("mes", mes)
        .eq("año", año)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Si no hay presupuestos este mes, copiar del mes anterior
      if ((data || []).length === 0) {
        const copiados = await copiarMesAnterior(mes, año);
        if (copiados.length > 0) {
          await fetchBudgets(mes, año);
          return;
        }
      }

      // Calcular gasto real por categoría
      const budgetsConGasto = await Promise.all(
        (data || []).map(async (b) => {
          const fechaDesde = `${año}-${String(mes).padStart(2, "0")}-01`;
          const fechaHasta = `${año}-${String(mes).padStart(2, "0")}-31`;
          const { data: txs } = await supabase
            .from("transactions")
            .select("monto")
            .eq("user_id", user.id)
            .eq("category_id", b.category_id)
            .eq("tipo", "gasto")
            .gte("fecha", fechaDesde)
            .lte("fecha", fechaHasta);
          const gastado = (txs || []).reduce(
            (acc, t) => acc + Number(t.monto),
            0,
          );
          return { ...b, gastado };
        }),
      );
      setBudgets(budgetsConGasto);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copia presupuestos del mes anterior al mes actual
  const copiarMesAnterior = async (mes, año) => {
    const mesPrev = mes === 1 ? 12 : mes - 1;
    const añoPrev = mes === 1 ? año - 1 : año;

    const { data: prevBudgets } = await supabase
      .from("budgets")
      .select("category_id, monto_limite")
      .eq("user_id", user.id)
      .eq("mes", mesPrev)
      .eq("año", añoPrev);

    if (!prevBudgets || prevBudgets.length === 0) return [];

    const nuevos = prevBudgets.map((b) => ({
      user_id: user.id,
      category_id: b.category_id,
      monto_limite: b.monto_limite,
      mes,
      año,
    }));

    const { data, error } = await supabase
      .from("budgets")
      .insert(nuevos)
      .select();

    if (error) return [];
    return data || [];
  };

  const createBudget = async (datos, mes, año) => {
    const { error } = await supabase
      .from("budgets")
      .insert([{ ...datos, user_id: user.id, mes, año }]);
    if (error) throw error;
    await fetchBudgets(mes, año);
  };

  const updateBudget = async (id, datos, mes, año) => {
    const { error } = await supabase
      .from("budgets")
      .update(datos)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchBudgets(mes, año);
  };

  const deleteBudget = async (id, mes, año) => {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchBudgets(mes, año);
  };

  // Verificar si una transacción de gasto supera algún presupuesto
  const verificarPresupuesto = async (categoryId, montoNuevo, fecha) => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const mes = fechaObj.getMonth() + 1;
    const año = fechaObj.getFullYear();

    // Buscar presupuesto de esa categoría ese mes
    const { data: budget } = await supabase
      .from("budgets")
      .select("monto_limite")
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .eq("mes", mes)
      .eq("año", año)
      .single();

    if (!budget) return null; // No tiene presupuesto, no hay warning

    // Calcular gasto actual en esa categoría ese mes
    const fechaDesde = `${año}-${String(mes).padStart(2, "0")}-01`;
    const fechaHasta = `${año}-${String(mes).padStart(2, "0")}-31`;

    const { data: txs } = await supabase
      .from("transactions")
      .select("monto")
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .eq("tipo", "gasto")
      .gte("fecha", fechaDesde)
      .lte("fecha", fechaHasta);

    const gastoActual = (txs || []).reduce(
      (acc, t) => acc + Number(t.monto),
      0,
    );
    const gastoNuevo = gastoActual + montoNuevo;
    const limite = budget.monto_limite;

    if (gastoNuevo > limite) {
      return {
        tipo: "superado",
        limite,
        gastoActual,
        gastoNuevo,
        exceso: gastoNuevo - limite,
      };
    }
    if ((gastoNuevo / limite) * 100 >= 80) {
      return {
        tipo: "alerta",
        limite,
        gastoActual,
        gastoNuevo,
        porcentaje: Math.round((gastoNuevo / limite) * 100),
      };
    }
    return null;
  };

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    verificarPresupuesto,
  };
}
