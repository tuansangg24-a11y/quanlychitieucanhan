import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Sổ chi tiêu cá nhân",
        short_name: "Sổ chi tiêu",
        description: "Ghi thu chi, xem thống kê và theo dõi ngân sách cá nhân.",
        lang: "vi",
        start_url: "/app",
        scope: "/",
        display: "standalone",
        theme_color: "#16604b",
        background_color: "#f7f8f4",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [],
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\/v1\//],
      },
      devOptions: { enabled: false },
    }),
  ],
});
