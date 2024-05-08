import type { UnpluginOptions } from "unplugin";
import type { INode } from "svgson";

export type Framework = "react" | "vue" | "svelte";

export type Transformer = (
  spriteSheet: INode,
  assetPath: string,
  packageName?: string
) => NonNullable<UnpluginOptions["transform"]>;

export interface Options {
  framework?: Framework;
  assetPath?: string;
  packageName?: string;
}
