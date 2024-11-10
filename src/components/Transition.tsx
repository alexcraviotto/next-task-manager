"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function Transition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{
          duration: 0.8,
          ease: [0.6, 0.01, -0.05, 0.9],
        }}
        key="transitionKey"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
