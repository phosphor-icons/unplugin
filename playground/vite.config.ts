import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Inspect from "vite-plugin-inspect";
import PhosphorUnplugin from "../src/vite";

export default defineConfig({
  plugins: [react(), Inspect(), PhosphorUnplugin({ dev: true })],
});
