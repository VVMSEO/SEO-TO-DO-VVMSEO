import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use relative base path so it works regardless of the GitHub repository name
  base: './',
  plugins: [react()],
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  }
});
