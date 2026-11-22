import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Same path aliases as tsconfig.json, so tests can import game modules that use them.
export default defineConfig({
  resolve: {
    alias: {
      '@/': fileURLToPath(new URL('./src/', import.meta.url)),
      '@shared/': fileURLToPath(new URL('./shared/', import.meta.url)),
    },
  },
})
