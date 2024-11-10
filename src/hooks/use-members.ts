import { useState, useCallback, useEffect } from "react";

interface Member {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  weight: number;
}

interface UseMembersReturn {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  addMember: (
    member: Omit<Member, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateMember: (id: number, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
}

export function useMembers(organizationId: string): UseMembersReturn {
  console.log("🚀 ~ useMembers ~ organizationId:", organizationId);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
      );
      if (!response.ok) throw new Error("Error fetching members");
      const data = await response.json();
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const addMember = async (
    member: Omit<Member, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (member.weight < 0 || member.weight > 5) {
      throw new Error("Weight must be between 0 and 5");
    }
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: member.username,
            email: member.email,
            isAdmin: member.isAdmin,
            weight: member.weight,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error adding member");
      }

      const newMember = await response.json();
      setMembers((prev) => [...prev, newMember]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const updateMember = async (id: number, member: Partial<Member>) => {
    if (
      member.weight !== undefined &&
      (member.weight < 0 || member.weight > 5)
    ) {
      throw new Error("Weight must be between 0 and 5");
    }
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(member),
        },
      );
      if (!response.ok) throw new Error("Error updating member");
      const updatedMember = await response.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updatedMember } : m)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const deleteMember = async (id: number) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members?memberId=${id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Error deleting member");
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    isLoading,
    error,
    addMember,
    updateMember,
    deleteMember,
  };
}
