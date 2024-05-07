import type { UnpluginOptions } from "unplugin";
import type { INode } from "svgson";

export type Framework = "react" | "vue" | "svelte";

export type Transformer = (spriteSheet: INode) => NonNullable<UnpluginOptions["transform"]>;

export interface Options {
  dev?: boolean;
  framework?: Framework;
}
