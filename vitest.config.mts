import path from 'path';
import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react"
export default defineConfig({
  test: {
    include: ['**/__tests__/**/*.tsx'],
    globals: true,
    environment: 'jsdom', 
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  
    },
  },
  plugins: [react()],
});
