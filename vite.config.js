import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [
        react(),
        {
            name: "runanywhere-wasm-path-fix",
            configureServer: function (server) {
                server.middlewares.use(function (req, _res, next) {
                    var _a;
                    var mutableReq = req;
                    if ((_a = mutableReq.url) === null || _a === void 0 ? void 0 : _a.startsWith("/node_modules/wasm/")) {
                        mutableReq.url = mutableReq.url.replace("/node_modules/wasm/", "/node_modules/@runanywhere/web-llamacpp/wasm/");
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
