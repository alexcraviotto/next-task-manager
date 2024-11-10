import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function MembersSkeleton() {
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full space-y-4 mt-10"
    >
      <motion.div
        className="border rounded-lg overflow-x-auto"
        variants={itemVariants}
      >
        <div className="min-w-[320px] lg:w-full">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between p-4 gap-4">
              <Skeleton className="h-4 w-[150px]" /> {/* Usuario */}
              <Skeleton className="h-4 w-[200px]" /> {/* Email */}
              <Skeleton className="h-4 w-[100px]" /> {/* Admin */}
              <Skeleton className="h-4 w-[150px]" /> {/* Fecha Creación */}
              <Skeleton className="h-4 w-[150px]" />{" "}
              {/* Última Actualización */}
              <Skeleton className="h-4 w-[150px]" /> {/* Peso */}
              <Skeleton className="h-4 w-[120px]" /> {/* Acciones */}
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
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[150px]" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" /> {/* Edit button */}
                  <Skeleton className="h-8 w-8" /> {/* Delete button */}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Skeleton className="h-10 w-[140px]" /> {/* Add Member button */}
      </motion.div>
    </motion.div>
  );
}
