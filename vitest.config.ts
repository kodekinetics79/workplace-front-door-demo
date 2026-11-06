import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { environment: "node", testTimeout: 30000, hookTimeout: 60000, fileParallelism: false },
});
