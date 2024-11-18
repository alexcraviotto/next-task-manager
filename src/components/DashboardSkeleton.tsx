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
      className="space-y-6 m-5"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Title Section */}
      <motion.div variants={itemVariants}>
        <Skeleton className="h-8 w-[300px]" />
      </motion.div>

      {/* Info Cards Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="p-6 rounded-lg border"
          >
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-5 w-24" />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts and Activity Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Monthly Chart Card */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 p-6 rounded-lg border"
        >
          <Skeleton className="h-7 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[250px] mb-4" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </motion.div>

        {/* Activity Card */}
        <motion.div variants={itemVariants} className="p-6 rounded-lg border">
          <Skeleton className="h-7 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[200px] mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Project Progress Card */}
      <motion.div variants={itemVariants} className="p-6 rounded-lg border">
        <Skeleton className="h-7 w-[180px] mb-2" />
        <Skeleton className="h-4 w-[220px] mb-4" />
        <Skeleton className="h-3 w-full rounded-full mb-2" />
        <Skeleton className="h-4 w-[250px]" />
      </motion.div>
    </motion.div>
  );
}
