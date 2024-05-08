import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import Inspect from "vite-plugin-inspect";
import PhosphorUnplugin from "../../src/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    Inspect(),
    PhosphorUnplugin({
      framework: "svelte",
      assetPath: "phosphor.svg",
      packageName: "phosphor-svelte",
    }),
  ],
});
