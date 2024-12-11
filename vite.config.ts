import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { resolve } from "path";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "RichTextEditor",
      fileName: (format) => `richtext-editor.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      plugins: [
        typescript({
          target: "es2015",
          rootDir: resolve("src/"),
          declaration: true,
          declarationDir: resolve("dist"),
          exclude: [resolve("node_modules/**")],
          allowSyntheticDefaultImports: true,
        }),
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
  },
});
