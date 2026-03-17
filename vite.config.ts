import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "runanywhere-wasm-path-fix",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const mutableReq = req as typeof req & { url?: string };

          if (mutableReq.url?.startsWith("/node_modules/wasm/")) {
            mutableReq.url = mutableReq.url.replace(
              "/node_modules/wasm/",
              "/node_modules/@runanywhere/web-llamacpp/wasm/"
            );
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ["@runanywhere/web", "@runanywhere/web-llamacpp"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
});
