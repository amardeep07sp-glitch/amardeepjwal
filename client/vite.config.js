import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import locator from "vite-react-locator";

// https://vite.dev/config/
export default defineConfig({
  plugins: [locator(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Explicit, not accidental - binds to every network interface (not just
    // localhost) so a phone on the same WiFi can open the PC's LAN IP, AND
    // (the part that actually matters for live-editing) so Vite's injected
    // HMR client on that phone connects its update websocket back to the
    // same LAN IP it loaded the page from instead of defaulting to
    // "localhost", which the phone can't resolve to this machine at all.
    // Without this, a phone tab silently keeps running whatever bundle it
    // first loaded - no error, no warning, it just never receives any
    // further edits, which is exactly the kind of thing that looks like a
    // UI bug but is actually a stale, disconnected tab.
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
