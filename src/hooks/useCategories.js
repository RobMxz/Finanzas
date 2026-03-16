import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import useAppStore from "../store/useAppStore";

export function useCategories() {
  const { user } = useAppStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre");
      if (error) throw error;
      setCategories(data || []);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (datos) => {
    const { error } = await supabase
      .from("categories")
      .insert([{ ...datos, user_id: user.id }]);
    if (error) throw error;
    await fetchCategories();
  };

  const deleteCategory = async (id) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchCategories();
  };

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    deleteCategory,
  };
}
