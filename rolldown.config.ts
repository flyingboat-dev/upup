import { defineConfig } from "rolldown";

export default defineConfig({
    input: "src/main.ts",
    output: {
        file: "dist/bundle.js",
        format: "esm",
    },
    //  don't try to bundle Node built-ins for cli
    external: [/^node:/],
    platform: "node",
});
