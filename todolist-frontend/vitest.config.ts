/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/utils/**',
        'src/stores/**',
        'src/composables/**',
        'src/api/**',
        'src/components/ThemeSwitch.vue'
      ],
      exclude: [
        'src/main.ts',
        'src/**/types.ts',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/test/**',
        'src/test-setup.ts',
        'src/**/*.test.ts'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
