import { Task } from "@/lib/types";
import { calculations } from "@/lib/calculations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskRating, ClientRating } from "@/lib/types";

interface ExtendedClientMetrics extends ClientRating {
  coverage: number;
  contributionToTotal: number;
  contributionToRequirement: number;
}

export default function Solution({
  metrics,
  effortLimit,
  tasks,
  taskRatings,
  effortFilter,
  clientRatings,
}: {
  metrics: {
    totalProductivity: number;
    coverage: number;
    totalEffort: number;
    totalSatisfaction: number;
  };
  effortLimit: number;
  tasks: Task[];
  taskRatings: {
    [key: number]: {
      clientSatisfaction: number;
      clientWeight: number;
      ratings: TaskRating[];
    };
  };
  effortFilter: number;
  clientRatings: ClientRating[];
}) {
  // Helper function to calculate client metrics
  const calculateClientMetrics = (
    taskRating: (typeof taskRatings)[number],
    clientRating: ClientRating,
    task: Task,
    totalSatisfaction: number,
  ): ExtendedClientMetrics => {
    const clientWeight = clientRating.organizationWeight;
    const clientValoracion = clientRating.valoracion;
    const taskSatisfaction = taskRating.clientSatisfaction;

    // Calcular contribución al total
    const contributionToTotal =
      (clientWeight * clientValoracion) / totalSatisfaction;

    // Calcular contribución al requisito
    const contributionToRequirement =
      (clientWeight * clientValoracion) / taskSatisfaction;

    // Calcular cobertura
    const coverage = clientValoracion / clientWeight;

    return {
      ...clientRating,
      coverage,
      contributionToTotal,
      contributionToRequirement,
    };
  };

  const filteredTasks = tasks
    .filter((task) => !task.deselected) // Filtrar tareas no deseleccionadas
    .map((task) => {
      const rating = taskRatings[task.id] || {
        clientSatisfaction: 0,
        clientWeight: 0,
      };
      const productivity = calculations.calculateProductivity(
        rating.clientSatisfaction,
        task.effort,
      );
      const contributionToTotal = calculations.calculateContributionToCliente(
        rating.clientSatisfaction,
        metrics.totalSatisfaction,
      );
      const contributionToRequirement =
        calculations.calculateContributionToRequirement(
          rating.clientWeight,
          rating.clientSatisfaction,
          rating.clientSatisfaction,
        );
      return {
        task,
        rating,
        productivity,
        contributionToTotal,
        contributionToRequirement,
      };
    })
    .sort((a, b) => {
      // Ordenar primero por satisfacción
      const satisfactionDiff =
        b.rating.clientSatisfaction - a.rating.clientSatisfaction;
      if (satisfactionDiff !== 0) return satisfactionDiff;
      // Si la satisfacción es igual, ordenar por productividad
      return b.productivity - a.productivity;
    })
    .reduce(
      (acc, curr) => {
        const effectiveLimit =
          effortFilter > 0 ? Math.min(effortFilter, effortLimit) : effortLimit;

        const totalEffortSoFar = acc.reduce(
          (sum, item) => sum + item.task.effort,
          0,
        );

        if (totalEffortSoFar + curr.task.effort <= effectiveLimit) {
          acc.push(curr);
        }

        return acc;
      },
      [] as Array<{
        task: Task;
        rating: (typeof taskRatings)[number];
        productivity: number;
        contributionToTotal: number;
        contributionToRequirement: number;
      }>,
    );

  return (
    <div className="mt-8 space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
      {/* Métricas Globales Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Productividad Global
          </h3>
          <p className="text-2xl font-bold text-pink-600">
            {metrics.totalProductivity.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Cobertura Total</h3>
          <p className="text-2xl font-bold text-pink-600">
            {(metrics.coverage * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Esfuerzo Total</h3>
          <p className="text-2xl font-bold text-pink-600">
            {filteredTasks.reduce((sum, item) => sum + item.task.effort, 0)}/
            {effortLimit}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Satisfacción Total
          </h3>
          <p className="text-2xl font-bold text-pink-600">
            {metrics.totalSatisfaction.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Requisito</TableHead>
              <TableHead className="font-semibold text-center">
                Esfuerzo
              </TableHead>
              <TableHead className="font-semibold text-center">
                Satisfacción Total
              </TableHead>
              <TableHead className="font-semibold text-center">
                Productividad
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map(({ task, rating, productivity }) => (
              <>
                {/* Fila principal del requisito */}
                <TableRow
                  key={`solution-${task.id}`}
                  className="hover:bg-gray-50 transition-colors bg-gray-50"
                >
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {task.effort}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                      {rating.clientSatisfaction}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {productivity.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>

                {/* Subencabezado para clientes */}
                <TableRow className="bg-gray-100/50 text-sm">
                  <TableCell colSpan={5} className="py-2">
                    <div className="font-medium text-gray-500">
                      Valoraciones por Cliente:
                    </div>
                  </TableCell>
                </TableRow>

                {/* Detalles de cada cliente */}
                {clientRatings.map((clientRating) => {
                  const metrics = calculateClientMetrics(
                    rating,
                    clientRating,
                    task,
                    rating.clientSatisfaction,
                  );

                  return (
                    <TableRow
                      key={`client-${task.id}-${metrics.id}`}
                      className="text-sm border-b border-gray-100"
                    >
                      <TableCell className="pl-8 text-gray-600">
                        {metrics.username}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
                          Peso: {metrics.organizationWeight}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-pink-50 text-pink-700">
                          Valor: {metrics.valoracion}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700">
                            Cont. Cliente:{" "}
                            {(metrics.contributionToTotal * 100).toFixed(1)}%
                          </span>
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">
                            Cont. Req:{" "}
                            {(metrics.contributionToRequirement * 100).toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700">
                          Cobertura: {(metrics.coverage * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Resumen y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Resumen de Selección</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-600">Tareas Seleccionadas:</span>
              <span className="font-medium">
                {filteredTasks.length} de {tasks.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Esfuerzo Utilizado:</span>
              <span className="font-medium">
                {filteredTasks.reduce((sum, item) => sum + item.task.effort, 0)}{" "}
                de {effortLimit}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Tareas Excluidas:</span>
              <span className="font-medium">
                {tasks.filter((t) => t.deselected).length}
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Recomendaciones</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600">
                Priorizar tareas con alta productividad
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">!</span>
              <span className="text-gray-600">
                Revisar requisitos con baja cobertura
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
