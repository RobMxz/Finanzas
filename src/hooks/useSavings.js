import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import useAppStore from "../store/useAppStore";

export function useSavings() {
  const { user } = useAppStore();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select(
          `
          *,
          contributions:savings_contributions(id, monto, fecha, nota)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Calcular total aportado por meta
      const goalsConTotal = (data || []).map((g) => ({
        ...g,
        total_aportado: (g.contributions || []).reduce(
          (acc, c) => acc + Number(c.monto),
          0,
        ),
      }));
      setGoals(goalsConTotal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (datos) => {
    const { error } = await supabase
      .from("savings_goals")
      .insert([{ ...datos, user_id: user.id }]);
    if (error) throw error;
    await fetchGoals();
  };

  const updateGoal = async (id, datos) => {
    const { error } = await supabase
      .from("savings_goals")
      .update(datos)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchGoals();
  };

  const deleteGoal = async (id) => {
    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchGoals();
  };

  const addContribution = async (goalId, datos) => {
    const { error } = await supabase
      .from("savings_contributions")
      .insert([{ ...datos, goal_id: goalId, user_id: user.id }]);
    if (error) throw error;
    await fetchGoals();
  };

  const deleteContribution = async (contributionId) => {
    const { error } = await supabase
      .from("savings_contributions")
      .delete()
      .eq("id", contributionId);
    if (error) throw error;
    await fetchGoals();
  };

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
  };
}
