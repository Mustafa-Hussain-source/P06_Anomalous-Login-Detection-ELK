import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'happy-dom',
    include: [resolve(__dirname, '../../../../Testing/tests/frontend/**/*.test.tsx')],
    globals: false,
    pool: 'threads',
  },
})
