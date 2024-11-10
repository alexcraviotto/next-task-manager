import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function DashboardSkeleton() {
  const containerVariants = {
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Title Skeleton */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <Skeleton className="h-10 w-[250px]" />
      </motion.div>

      {/* Info Cards Grid Skeleton */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 mt-10 gap-4 md:gap-16">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="h-[100px] flex flex-col items-center justify-center space-y-2"
          >
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-24" />
          </motion.div>
        ))}
      </motion.div>

      {/* Chart Skeleton */}
      <motion.div className="mt-20 space-y-4" variants={itemVariants}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </motion.div>
    </motion.div>
  );
}
