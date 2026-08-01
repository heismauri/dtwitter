import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: "app",
  resolve: {
    tsconfigPaths: true
  },
  server: {
    proxy: {
      // dtwitter's API lives at POST /, sharing the same path as the SPA shell.
      // Only proxy non-GET requests to wrangler dev; let Vite serve index.html for GET.
      "^/$": {
        target: "http://localhost:8787",
        bypass: (req) => (req.method === "GET" ? req.url : undefined)
      }
    }
  }
});
