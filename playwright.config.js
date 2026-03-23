import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // IndexedDB state — run serially to avoid interference
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    // Mobile viewport — this is a mobile-first PWA
    viewport: { width: 390, height: 844 },
    // Keep headless for CI; flip to false locally when debugging
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
