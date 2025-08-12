import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const isDev = process.env.NODE_ENV !== 'production';

function devHttps() {
  try {
    return {
      key: fs.readFileSync(path.resolve(__dirname, './localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './localhost+2.pem')),
    };
  } catch {
    return undefined; // fall back to HTTP if certs missing
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    //https: isDev ? devHttps() : undefined, //enable this for https in dev (safari testing)
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
});