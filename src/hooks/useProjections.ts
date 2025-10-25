import { useState, useEffect } from "react";

export function useProjections(months: number = 12) {
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjections();
  }, [months]);

  const loadProjections = async () => {
    try {
      const response = await fetch(`/api/projections-v3?months=${months}`);
      const data = await response.json();
      setProjections(data);
    } catch (error) {
      console.error("Error loading projections:", error);
    } finally {
      setLoading(false);
    }
  };

  return { projections, loading };
}
