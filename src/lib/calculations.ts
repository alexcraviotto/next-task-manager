export const calculations = {
  calculateProductivity(satisfaction: number, effort: number): number {
    if (!satisfaction || !effort || effort <= 0) return 0;
    return satisfaction / effort;
  },

  calculateContributionToCliente(
    requirementSatisfaction: number,
    totalSatisfaction: number,
  ): number {
    if (
      !requirementSatisfaction ||
      !totalSatisfaction ||
      totalSatisfaction <= 0
    )
      return 0;
    return requirementSatisfaction / totalSatisfaction;
  },

  calculateContributionToRequirement(
    clientWeight: number,
    clientPriority: number,
    requirementSatisfaction: number,
  ): number {
    if (
      !clientWeight ||
      !clientPriority ||
      !requirementSatisfaction ||
      requirementSatisfaction <= 0
    )
      return 0;
    return (clientWeight * clientPriority) / requirementSatisfaction;
  },

  calculateCoverage(priorities: number[], weights: number[]): number {
    const totalWeights = weights.reduce((sum, w) => sum + (w || 0), 0);
    if (!totalWeights) return 0;
    return priorities.reduce((sum, p) => sum + (p || 0), 0) / totalWeights;
  },

  calculateTaskSatisfaction(
    clientWeights: number[],
    organizationWeights: number[],
  ): number {
    return clientWeights.reduce((total, weight, index) => {
      const orgWeight = organizationWeights[index] || 0;
      return total + (weight || 0) * orgWeight;
    }, 0);
  },

  calculateGlobalMetrics(
    tasks: Array<{
      id: number;
      name: string;
      ratings: {
        clientSatisfaction: number;
        clientWeight: number;
      };
      effort: number;
    }>,
  ) {
    const filteredTasks = tasks.filter((t) => t.ratings && t.effort > 0);

    const totalEffort = filteredTasks.reduce(
      (sum, t) => sum + (t.effort || 0),
      0,
    );
    const totalSatisfaction = filteredTasks.reduce(
      (sum, t) => sum + (t.ratings.clientSatisfaction || 0),
      0,
    );

    const priorities = filteredTasks.map(
      (t) => t.ratings.clientSatisfaction || 0,
    );
    const weights = filteredTasks.map((t) => t.ratings.clientWeight || 0);

    const coverage = this.calculateCoverage(priorities, weights);
    const totalProductivity = this.calculateProductivity(
      totalSatisfaction,
      totalEffort,
    );

    return {
      totalProductivity,
      coverage,
      totalEffort,
      totalSatisfaction,
    };
  },
};
