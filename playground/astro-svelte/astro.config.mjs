import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import Inspect from "vite-plugin-inspect";
import PhosphorUnplugin from "../../src/astro";

// https://astro.build/config
export default defineConfig({
  // Enable Svelte to support Svelte components.
  integrations: [svelte(),
  PhosphorUnplugin({ framework: "svelte", packageName: "phosphor-svelte" }),
  ],
  vite: {
    plugins: [
      Inspect(),
    ]
  },
});
