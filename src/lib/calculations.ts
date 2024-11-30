interface TaskRating {
  clientSatisfaction: number;
  clientWeight: number;
  effort: number;
}

interface TaskWithRatings {
  id: number;
  name: string;
  ratings: TaskRating;
}

export const calculations = {
  // Calcula la productividad (satisfacción/esfuerzo)
  calculateProductivity: (satisfaction: number, effort: number): number => {
    if (effort === 0) return 0;
    return Number((satisfaction / effort).toFixed(2));
  },

  // Calcula la contribución (satisfacción individual / satisfacción total)
  calculateContribution: (
    taskSatisfaction: number,
    totalSatisfaction: number,
  ): number => {
    if (totalSatisfaction === 0) return 0;
    return Number((taskSatisfaction / totalSatisfaction).toFixed(2));
  },

  // Calcula la cobertura (satisfacción acumulada / satisfacción máxima posible)
  calculateCoverage: (
    currentSatisfaction: number,
    maxPossibleSatisfaction: number,
  ): number => {
    if (maxPossibleSatisfaction === 0) return 0;
    return Number((currentSatisfaction / maxPossibleSatisfaction).toFixed(2));
  },

  // Calcula métricas globales para todas las tareas
  calculateGlobalMetrics: (tasks: TaskWithRatings[]) => {
    const totalSatisfaction = tasks.reduce(
      (sum, task) => sum + task.ratings.clientSatisfaction,
      0,
    );

    const totalEffort = tasks.reduce(
      (sum, task) => sum + task.ratings.effort,
      0,
    );

    const maxPossibleSatisfaction = tasks.reduce((sum, task) => {
      const maxClientWeight = 5; // Valor máximo posible de peso
      return sum + task.ratings.clientWeight * maxClientWeight;
    }, 0);

    return {
      totalSatisfaction,
      totalEffort,
      totalProductivity: calculations.calculateProductivity(
        totalSatisfaction,
        totalEffort,
      ),
      coverage: calculations.calculateCoverage(
        totalSatisfaction,
        maxPossibleSatisfaction,
      ),
    };
  },
};
