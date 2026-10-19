import { loadEnv } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  return {
    root: __dirname,
    envDir,
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": env.API_PROXY_TARGET ?? "http://localhost:3001",
      },
    },
  };
});
