import { defineConfig } from 'vitest/config';

// `npm run bench`: timing checks for grid-core at its target size.
// Kept out of `npm test` so unit tests stay fast and deterministic.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/grid-core/**/*.bench.ts'],
  },
});
