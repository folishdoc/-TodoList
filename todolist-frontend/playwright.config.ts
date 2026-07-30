import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/debug/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    storageState: './e2e/storage-state.json'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5180 --strictPort',
      url: 'http://localhost:5180',
      reuseExistingServer: true,
      timeout: 60000
    },
    {
      command: './mvnw spring-boot:run',
      port: 18080,
      cwd: '..',
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
})
