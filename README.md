> [!WARNING]
> This plugin is extremely experimental, and is subject to change. Use at your own risk!


# @phosphor-icons/unplugin

<!-- BEGIN_LOGO -->
<img src="/.github/logo.png" width="128" align="right" />
<!-- END_LOGO -->

An [unplugin](https://github.com/unjs/unplugin) for transforming your Phosphor Icon imports into static SVG sprite sheets. Multiple frameworks, metaframeworks, and build tooling supported, although very much WIP. Explore all our icons at [phosphoricons.com](https://phosphoricons.com).

[![NPM](https://img.shields.io/npm/v/@phosphor-icons/unplugin.svg?style=flat-square)](https://www.npmjs.com/package/@phosphor-icons/unplugin) [![Travis](https://img.shields.io/github/actions/workflow/status/phosphor-icons/unplugin/ci.yml?branch=main&style=flat-square)](https://travis-ci.com/github/phosphor-icons/unplugin) [![Travis](https://img.shields.io/github/actions/workflow/status/phosphor-icons/unplugin/release.yml?branch=main&style=flat-square&label=release)](https://travis-ci.com/github/phosphor-icons/unplugin)

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

The plugin can be configured to work with 

- **framework?**: `"react" | "svelte" | "vue"` — The base framework of your code. Defaults to `"react"`.
- **assetPath?**: `string` — The relative URL at which the generated sprite sheet will be placed. Defaults to `/phosphor.svg`.
- **packageName?**: `string` — Override the default Phosphor package which will be transformed. The default depends on th framework chosen:
  - `react`: `@phosphor-icons/react`
  - `vue`: `@phosphor-icons/vue`
  - `svelte`: `phosphor-svelte`

## Usage

Import icons from the Phosphor package as normal, making sure that all props passed to rendered icons are *literal* values:

```tsx
// App.tsx
import { Smiley, SmileySad } from "@phosphor-icons/react";

function App() {
  return (
    <p>
      <span>Hello, world! Yesterday I was</span>
      <SmileySad color="blue" size="2em" />
      <span>, today I am</span>
      <Smiley weight="fill" color="goldenrod" size="3em" />
      <span>!</span>
    </p>
  );
}
```

This will be transformed at build-time into something resembling this:

```tsx
// App.tsx
import { Smiley, SmileySad } from "@phosphor-icons/react";

function App() {
  return (
    <p>
      <span>Hello, world! Yesterday I was</span>
      <svg color="blue" width="2em" height="2em">
        <use href="/phosphor.svhgsmiley-sad-regular" />
      </svg>
      <span>, today I am</span>
      <svg color="goldenrod" width="3em" height="3em">
        <use href="/phosphor.svg#smiley-fill" />
      </svg>
      <span>!</span>
    </p>
  );
}
```

And a sprite sheet will be generated and placed at `assetPath` in the public directory of your build directory:

```svg
<!-- phosphor.svg -->
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol viewBox="0 0 256 256" fill="currentColor" id="smiley-sad-regular">
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.08,64a8,8,0,1,1-13.84,8c-7.47-12.91-19.21-20-33.08-20s-25.61,7.1-33.08,20a8,8,0,1,1-13.84-8c10.29-17.79,27.39-28,46.92-28S164.63,154.2,174.92,172Z"></path>
  </symbol>
  <symbol viewBox="0 0 256 256" fill="currentColor" id="smiley-fill">
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM92,96a12,12,0,1,1-12,12A12,12,0,0,1,92,96Zm82.92,60c-10.29,17.79-27.39,28-46.92,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.08-20a8,8,0,1,1,13.84,8ZM164,120a12,12,0,1,1,12-12A12,12,0,0,1,164,120Z"></path>
  </symbol>
</svg>
```

In future, we hope to support dynamic and computed props for all frameworks and build tooling, but at the moment any non-literal props will cause the build process to fail.

<!-- BEGIN_LINKS -->
## Our Projects

- [@phosphor-icons/homepage](https://github.com/phosphor-icons/homepage) ▲ Phosphor homepage and general info
- [@phosphor-icons/core](https://github.com/phosphor-icons/core) ▲ Phosphor icon assets and catalog
- [@phosphor-icons/elm](https://github.com/phosphor-icons/phosphor-elm) ▲ Phosphor icons for Elm
- [@phosphor-icons/figma](https://github.com/phosphor-icons/figma) ▲ Phosphor icons Figma plugin
- [@phosphor-icons/flutter](https://github.com/phosphor-icons/flutter) ▲ Phosphor IconData library for Flutter
- [@phosphor-icons/pack](https://github.com/phosphor-icons/pack) ▲ Phosphor web font stripper to generate minimal icon bundles
- [@phosphor-icons/penpot](https://github.com/phosphor-icons/penpot) ▲ Phosphor icons Penpot plugin
- [@phosphor-icons/react](https://github.com/phosphor-icons/react) ▲ Phosphor icon component library for React
- [@phosphor-icons/sketch](https://github.com/phosphor-icons/sketch) ▲ Phosphor icons Sketch plugin
- [@phosphor-icons/swift](https://github.com/phosphor-icons/swift) ▲ Phosphor icon component library for SwiftUI
- [@phosphor-icons/theme](https://github.com/phosphor-icons/theme) ▲ A VS Code (and other IDE) theme with the Phosphor color palette
- [@phosphor-icons/unplugin](https://github.com/phosphor-icons/unplugin) ▲ A multi-framework bundler plugin for generating Phosphor sprite sheets
- [@phosphor-icons/vue](https://github.com/phosphor-icons/vue) ▲ Phosphor icon component library for Vue
- [@phosphor-icons/web](https://github.com/phosphor-icons/web) ▲ Phosphor icons for Vanilla JS
- [@phosphor-icons/webcomponents](https://github.com/phosphor-icons/webcomponents) ▲ Phosphor icons as Web Components

## Community Projects

- [adamglin0/compose-phosphor-icons](https://github.com/adamglin0/compose-phosphor-icon) ▲ Phosphor icons for Compose Multiplatform
- [altdsoy/phosphor_icons](https://github.com/altdsoy/phosphor_icons) ▲ Phosphor icons for Phoenix and TailwindCSS
- [amPerl/egui-phosphor](https://github.com/amperl/egui-phosphor) ▲ Phosphor icons for egui apps (Rust)
- [babakfp/phosphor-icons-svelte](https://github.com/babakfp/phosphor-icons-svelte) ▲ Phosphor icons for Svelte apps
- [brettkolodny/phosphor-lustre](https://github.com/brettkolodny/phosphor-lustre) ▲ Phosphor icons for Lustre
- [cellularmitosis/phosphor-uikit](https://github.com/cellularmitosis/phosphor-uikit) ▲ XCode asset catalog generator for Phosphor icons (Swift/UIKit)
- [cjohansen/phosphor-clj](https://github.com/cjohansen/phosphor-clj) ▲ Phosphor icons as Hiccup for Clojure and ClojureScript
- [codeat3/blade-phosphor-icons](https://github.com/codeat3/blade-phosphor-icons) ▲ Phosphor icons in your Laravel Blade views
- [dreamRs/phosphor-r](https://github.com/dreamRs/phosphoricons) ▲ Phosphor icon wrapper for R documents and applications
- [duongdev/phosphor-react-native](https://github.com/duongdev/phosphor-react-native) ▲ Phosphor icon component library for React Native
- [haruaki07/phosphor-svelte](https://github.com/haruaki07/phosphor-svelte) ▲ Phosphor icons for Svelte apps
- [IgnaceMaes/ember-phosphor-icons](https://github.com/IgnaceMaes/ember-phosphor-icons) ▲ Phosphor icons for Ember apps
- [iota-uz/icons](https://github.com/iota-uz/icons) ▲ Phosphor icons as Templ components (Go)
- [jajuma/phosphorhyva](https://github.com/JaJuMa-GmbH/phosphor-hyva) ▲ Phosphor icons for Magento 2 & Mage-OS with Hyvä Theme
- [Kitten](https://kitten.small-web.org/reference/#icons) ▲ Phosphor icons integrated by default in Kitten
- [lucagoslar/phosphor-css](https://github.com/lucagoslar/phosphor-css) ▲ CSS wrapper for Phosphor SVG icons
- [maful/ruby-phosphor-icons](https://github.com/maful/ruby-phosphor-icons) ▲ Phosphor icons for Ruby and Rails applications
- [meadowsys/phosphor-svgs](https://github.com/meadowsys/phosphor-svgs) ▲ Phosphor icons as Rust string constants
- [mwood/tamagui-phosphor-icons](https://github.com/mwood23/tamagui-phosphor-icons) ▲ Phosphor icons for Tamagui
- [noozo/phosphoricons_elixir](https://github.com/noozo/phosphoricons_elixir) ▲ Phosphor icons as SVG strings for Elixir/Phoenix
- [oyedejioyewole/nuxt-phosphor-icons](https://github.com/oyedejioyewole/nuxt-phosphor-icons) ▲ Phosphor icons integration for Nuxt
- [pepaslabs/phosphor-uikit](https://github.com/pepaslabs/phosphor-uikit) ▲ Xcode asset catalog generator for Swift/UIKit
- [raycast/phosphor-icons](https://www.raycast.com/marinsokol/phosphor-icons) ▲ Phosphor icons Raycast extension
- [reatlat/eleventy-plugin-phosphoricons](https://github.com/reatlat/eleventy-plugin-phosphoricons) ▲ An Eleventy shortcode plugin to embed icons as inline SVGs
- [robruiz/wordpress-phosphor-icons-block](https://github.com/robruiz/phosphor-icons-block) ▲ Phosphor icon block for use in WordPress v5.8+
- [sachaw/solid-phosphor](https://github.com/sachaw/solid-phosphor) ▲ Phosphor icons for SolidJS
- [SeanMcP/phosphor-astro](https://github.com/SeanMcP/phosphor-astro) ▲ Phosphor icons as Astro components
- [SorenHolstHansen/phosphor-leptos](https://github.com/SorenHolstHansen/phosphor-leptos) ▲ Phosphor icon component library for Leptos apps (Rust)
- [vnphanquang/phosphor-icons-tailwindcss](https://github.com/vnphanquang/phosphor-icons-tailwindcss) ▲ TailwindCSS plugin for Phosphor icons
- [wireui/phosphoricons](https://github.com/wireui/phosphoricons) ▲ Phosphor icons for Laravel

If you've made a port of Phosphor and you want to see it here, just open a PR [here](https://github.com/phosphor-icons/homepage)!

## License

MIT © [Phosphor Icons](https://github.com/phosphor-icons)
<!-- END_LINKS -->
