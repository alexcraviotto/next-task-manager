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
export default function Solution({
  metrics,
  effortLimit,
  tasks,
  taskRatings,
  effortFilter,
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
      effort: number;
    };
  };
  effortFilter: number;
}) {
  const filteredTasks = tasks
    .filter((task) => !task.deselected) // Filtrar tareas no deseleccionadas
    .map((task) => {
      const rating = taskRatings[task.id] || {
        clientSatisfaction: 0,
        clientWeight: 0,
        effort: 0,
      };
      const productivity = calculations.calculateProductivity(
        rating.clientSatisfaction,
        rating.effort,
      );
      return {
        task,
        rating,
        productivity,
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
          (sum, item) => sum + item.rating.effort,
          0,
        );

        if (totalEffortSoFar + curr.rating.effort <= effectiveLimit) {
          acc.push(curr);
        }

        return acc;
      },
      [] as Array<{
        task: Task;
        rating: (typeof taskRatings)[number];
        productivity: number;
      }>,
    );

  return (
    <div className="mt-8 space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4">Análisis de Solución</h2>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Productividad Total
          </h3>
          <p className="text-2xl font-bold text-pink-600">
            {metrics.totalProductivity}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Cobertura Cliente
          </h3>
          <p className="text-2xl font-bold text-pink-600">
            {(metrics.coverage * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Esfuerzo Total</h3>
          <p className="text-2xl font-bold text-pink-600">
            {metrics.totalEffort}/{effortLimit}
          </p>
        </div>
      </div>

      {/* Tabla de Análisis Detallado */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requisito</TableHead>
              <TableHead>Productividad</TableHead>
              <TableHead>Contribución</TableHead>
              <TableHead>Cobertura</TableHead>
              <TableHead>Esfuerzo</TableHead>
              <TableHead>Prioridad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map(({ task, rating, productivity }) => {
              const contribution = calculations.calculateContribution(
                rating.clientSatisfaction,
                metrics.totalSatisfaction,
              );

              return (
                <TableRow key={`solution-${task.id}`}>
                  <TableCell className="font-medium">
                    {task.name}
                    <span className="ml-2 text-xs text-gray-500">
                      (Satisfacción: {rating.clientSatisfaction})
                    </span>
                  </TableCell>
                  <TableCell>{productivity.toFixed(2)}</TableCell>
                  <TableCell>{contribution.toFixed(2)}</TableCell>
                  <TableCell>
                    {calculations.calculateCoverage(
                      rating.clientSatisfaction,
                      rating.clientWeight * 5,
                    )}
                  </TableCell>
                  <TableCell>{rating.effort}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        productivity > 1
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {productivity > 1 ? "Alta" : "Media"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Información del filtro y métricas de la solución */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600">
          Esfuerzo máximo permitido:{" "}
          {effortFilter > 0 ? Math.min(effortFilter, effortLimit) : effortLimit}
        </p>
        <p className="text-sm text-gray-600">
          Esfuerzo total utilizado:{" "}
          {filteredTasks.reduce((sum, item) => sum + item.rating.effort, 0)}
        </p>
        <p className="text-sm text-gray-600">
          Tareas seleccionadas: {filteredTasks.length} de {tasks.length}
        </p>
        <p className="text-sm text-gray-600">
          Tareas excluidas manualmente:{" "}
          {tasks.filter((t) => t.deselected).length}
        </p>
      </div>

      {/* Recomendaciones */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Recomendaciones</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
            <span className="ml-2 text-sm text-gray-600">
              Priorizar tareas con alta productividad y baja contribución
            </span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-yellow-500">!</span>
            <span className="ml-2 text-sm text-gray-600">
              Revisar requisitos con baja cobertura
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
