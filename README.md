> [!WARNING]
> This plugin is extremely experimental, and is subject to change. Use at your own risk!

<img src="/meta/phosphor-mark-tight-black.png" width="96" align="right" />

# @phosphor-icons/unplugin

An [unplugin](https://github.com/unjs/unplugin) for transforming your Phosphor Icon imports into static SVG sprite sheets. Multiple frameworks, metaframeworks, and build tooling supported, although very much WIP. Explore all our icons at [phosphoricons.com](https://phosphoricons.com).

[![NPM](https://img.shields.io/npm/v/@phosphor-icons/unplugin.svg?style=flat-square)](https://www.npmjs.com/package/@phosphor-icons/unplugin) [![Travis](https://img.shields.io/github/actions/workflow/status/phosphor-icons/unplugin/main.yml?branch=vite&style=flat-square)](https://travis-ci.com/github/phosphor-icons/unplugin)

[![GitHub stars](https://img.shields.io/github/stars/phosphor-icons/unplugin?style=flat-square&label=Star)](https://github.com/phosphor-icons/unplugin)
[![GitHub forks](https://img.shields.io/github/forks/phosphor-icons/unplugin?style=flat-square&label=Fork)](https://github.com/phosphor-icons/unplugin/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/phosphor-icons/unplugin?style=flat-square&label=Watch)](https://github.com/phosphor-icons/unplugin)
[![Follow on GitHub](https://img.shields.io/github/followers/rektdeckard?style=flat-square&label=Follow)](https://github.com/rektdeckard)

## Installation

```bash
npm i -D @phosphor-icons/unplugin
#^ or whatever package manager you use
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import PhosphorUnplugin from "@phosphor-icons/unplugin/vite";

export default defineConfig({
  plugins: [
    PhosphorUnplugin({
      framework: "react",
      assetPath: "/assets/phosphor.svg"
    }),
  ],
});
```

Example: [`playground/react-vite`](./playground/react-vite)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import PhosphorUnplugin from "@phosphor-icons/unplugin/vite";

export default {
  plugins: [
    PhosphorUnplugin({
      /* options */
    }),
  ],
};
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require("@phosphor-icons/unplugin/webpack")({
      /* options */
    }),
  ],
};
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    [
      "@phosphor-icons/unplugin/nuxt",
      {
        framework: "vue",
        /* options */
      },
    ],
  ],
});
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require("@phosphor-icons/unplugin/webpack")({
        framework: "vue",
        /* options */
      }),
    ],
  },
};
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from "esbuild";
import PhosphorUnplugin from "@phosphor-icons/unplugin/esbuild";

build({
  plugins: [PhosphorUnplugin({ framework: "react" })],
});
```

<br></details>

## Options



## Usage
