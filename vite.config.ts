import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "@@": path.resolve(__dirname, "src"),
      "components": fileURLToPath(new URL("./components", import.meta.url)),
      "views": fileURLToPath(new URL("./views", import.meta.url)),
      "data": fileURLToPath(new URL("./data", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/svm": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
