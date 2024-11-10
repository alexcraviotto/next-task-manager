import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function TasksSkeleton() {
  const containerVariants = {
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <div className="w-full space-y-4 mt-10">
        <motion.div
          className="border rounded-lg overflow-x-auto"
          variants={itemVariants}
        >
          <div className="min-w-full">
            {/* Header */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between p-4 gap-4">
                <Skeleton className="h-4 w-[150px]" /> {/* Tareas */}
                <Skeleton className="h-4 w-[150px]" /> {/* Descripción */}
                <Skeleton className="h-4 w-[100px]" /> {/* Tipo */}
                <Skeleton className="h-4 w-[100px]" /> {/* Inicio */}
                <Skeleton className="h-4 w-[100px]" /> {/* Fin */}
                <Skeleton className="h-4 w-[90px]" /> {/* Progreso */}
                <Skeleton className="h-4 w-[100px]" /> {/* Dependientes */}
                <Skeleton className="h-4 w-[120px]" /> {/* Satisfacción */}
                <Skeleton className="h-4 w-[120px]" /> {/* Peso */}
                <Skeleton className="h-4 w-[120px]" /> {/* Esfuerzo */}
                <Skeleton className="h-4 w-[100px]" /> {/* Acciones */}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="flex justify-between p-4 gap-4 bg-white"
                >
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[90px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" /> {/* Edit button */}
                    <Skeleton className="h-8 w-8" /> {/* Delete button */}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      <motion.div variants={itemVariants}>
        <Skeleton className="mt-2 h-10 w-[140px]" /> {/* Add Task button */}
      </motion.div>
    </motion.div>
  );
}
