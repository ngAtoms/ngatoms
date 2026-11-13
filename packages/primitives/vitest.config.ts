import { defineConfig } from 'vitest/config';

// Only the framework-free grid core runs here. The directive specs
// (button, input) need an Angular TestBed setup and are not wired yet.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/grid-core/**/*.spec.ts'],
  },
});
