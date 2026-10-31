import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  // Les écrans des espaces privés sont chargés à la demande : on pré-analyse tout le code
  // pour éviter une ré-optimisation des dépendances (et un rechargement) en cours de navigation
  optimizeDeps: { entries: ["src/**/*.tsx"] },
  server: {
    port: 5173,
    // Pas de repli silencieux sur 5174 : Better Auth n’accepte que l’origine CLIENT_URL (connexion, déconnexion…)
    strictPort: true,
    // Même origine pour le navigateur : pas de souci de cookies ni de CORS en dev
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } },
  },
});