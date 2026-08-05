import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy auth requests to the local Worker dev server so there's no CORS
    // issue during development. The worker runs on :8787 by default.
    proxy: {
      "/auth": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
