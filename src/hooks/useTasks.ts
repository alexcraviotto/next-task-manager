"use client";
import { Task } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";

export function useTasks(organizationId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organizations?id=${organizationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching tasks");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, setIsLoading, setTasks, setError]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (newTask: Omit<Task, "id">) => {
    if (newTask.weight < 0 || newTask.weight > 5) {
      throw new Error("Weight must be between 0 and 5");
    }
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setTasks((current) => [...current, data.task]);
      return data.task;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding task");
      throw err;
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    if (
      updates.weight !== undefined &&
      (updates.weight < 0 || updates.weight > 5)
    ) {
      throw new Error("Weight must be between 0 and 5");
    }
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, ...data.task } : task,
        ),
      );
      return data.task;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating task");
      throw err;
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting task");
      throw err;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
}
