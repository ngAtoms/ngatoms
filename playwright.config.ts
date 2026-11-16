import { defineConfig } from '@playwright/test';

/**
 * Manual Chromium pass for the docs grid page. The overlay-in-dialog spec
 * also runs in Firefox and WebKit. Not part of `npm test` and not wired into CI.
 * Reports and traces stay out of the repo.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: '/tmp/ngatoms-grid-v1-playwright',
  reporter: 'list',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:4217',
    viewport: { width: 1440, height: 900 },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' }, testMatch: /overlay-dialog\.spec\.ts$/ },
    { name: 'webkit', use: { browserName: 'webkit' }, testMatch: /overlay-dialog\.spec\.ts$/ },
  ],
  webServer: {
    command: 'npx ng serve docs --host 127.0.0.1 --port 4217',
    url: 'http://127.0.0.1:4217/grid',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
