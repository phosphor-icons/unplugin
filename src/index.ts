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
import {
  transformer as svelteTransformer,
  transformInclude as svelteTransformInclude,
} from "./frameworks/svelte";
import type { Options, Framework, Transformer } from "./types";
export type { Options, Framework };

const transformer: Record<Framework, NonNullable<Transformer>> = {
  react: reactTransformer,
  svelte: svelteTransformer,
  vue: () => () => undefined,
};

const transformInclude: Record<Framework, UnpluginOptions["transformInclude"]> =
{
  react: reactTransformInclude,
  svelte: svelteTransformInclude,
  vue: (id) => /\.vue$/.test(id),
};

export const unpluginFactory: UnpluginFactory<Options | undefined> = ({
  framework = "react",
  assetPath = "phosphor.svg",
  packageName,
} = {}) => {
  const spriteSheet: INode = {
    name: "svg",
    type: "element",
    value: "",
    attributes: { xmlns: "http://www.w3.org/2000/svg" },
    children: [],
  };

  if (assetPath.startsWith("/")) assetPath = assetPath.slice(1);

  return {
    name: "@phosphor-icons/unplugin",
    apply: "build",
    transformInclude: transformInclude[framework],
    transform: transformer[framework].bind(this)(
      spriteSheet,
      assetPath,
      packageName
    ),
    buildEnd() {
      this.emitFile({
        fileName: assetPath,
        needsCodeReference: false,
        source: stringify(spriteSheet),
        type: "asset",
      });
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
