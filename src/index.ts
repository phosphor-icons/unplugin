import { stringify, type INode } from "svgson";
import {
  createUnplugin,
  type UnpluginFactory,
  type UnpluginOptions,
} from "unplugin";

import {
  transformer as reactTransformer,
  transformInclude as reactTransformInclude,
} from "./frameworks/react";
import type { Options, Framework, Transformer } from "./types";

const transformer: Record<Framework, NonNullable<Transformer>> = {
  react: reactTransformer,
  svelte: () => () => undefined,
  vue: () => () => undefined,
};
const transformInclude: Record<Framework, UnpluginOptions["transformInclude"]> =
  {
    react: reactTransformInclude,
    svelte: (id) => /\.svelte$/.test(id),
    vue: (id) => /\.vue$/.test(id),
  };

const isProduction = process.env.NODE_ENV === "production";

export const unpluginFactory: UnpluginFactory<Options | undefined> = ({
  dev,
  framework = "react",
} = {}) => {
  const isDevMode = dev && !isProduction;

  const spriteSheet: INode = {
    name: "svg",
    type: "element",
    value: "",
    attributes: { xmlns: "http://www.w3.org/2000/svg" },
    children: [],
  };

  return {
    name: "@phosphor-icons/unplugin",
    apply: dev ? undefined : "build",
    transformInclude: transformInclude[framework],
    transform: transformer[framework].bind(this)(spriteSheet),
    buildEnd() {
      this.emitFile({
        fileName: isDevMode ? "phosphor.svg" : "phosphor.svg",
        needsCodeReference: false,
        source: stringify(spriteSheet, {}),
        type: "asset",
      });
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
