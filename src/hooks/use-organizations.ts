import { useState, useEffect, useCallback } from "react";

interface Organization {
  id: string;
  name: string;
  createdById: number;
}

interface UseOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
  addOrganization: (org: Organization) => void;
  removeOrganization: (id: string) => void;
}

export function useOrganizations(): UseOrganizationsReturn {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/organizations");
      if (!response.ok) throw new Error("Error fetching organizations");
      const data = await response.json();
      setOrganizations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Método para refrescar los datos
  const mutate = useCallback(async () => {
    await fetchOrganizations();
  }, []);

  // Método para añadir una organización localmente
  const addOrganization = useCallback((org: Organization) => {
    setOrganizations((prev) => [...prev, org]);
  }, []);

  // Método para eliminar una organización localmente
  const removeOrganization = useCallback((id: string) => {
    setOrganizations((prev) => prev.filter((org) => org.id !== id));
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return {
    organizations,
    loading,
    error,
    mutate,
    addOrganization,
    removeOrganization,
  };
}
