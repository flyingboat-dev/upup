import { defineConfig } from "rolldown";

export default defineConfig({
    input: "src/main.ts",
    output: {
        file: "dist/bundle.js",
        format: "esm",
    },
    // For Node CLIs: don't try to bundle Node built-ins
    external: [/^node:/],
    platform: "node",
});