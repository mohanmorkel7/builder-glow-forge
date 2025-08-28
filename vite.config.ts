import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      timeout: 15000, // Increased timeout to prevent premature disconnections
      overlay: false,
      clientPort: 8080, // Explicit client port to avoid connection issues
      port: 8080, // Ensure HMR port matches server port
    },
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    watch: {
      ignored: ["**/server/data/**", "**/node_modules/**", "**/.git/**"],
      // Add debouncing to prevent rapid file change events
      usePolling: false,
      interval: 100,
    },
    // Add connection stability
    middlewareMode: false,
    open: false,
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      try {
        const app = createServer();

        // Add Express app as middleware to Vite dev server with error handling
        server.middlewares.use((req, res, next) => {
          try {
            app(req, res, next);
          } catch (error) {
            console.error("Express middleware error:", error);
            next(error);
          }
        });
      } catch (error) {
        console.error("Failed to create Express server:", error);
        console.log("Continuing without Express middleware...");
      }
    },
  };
}
