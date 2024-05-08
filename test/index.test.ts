import { describe, expect, it } from "vitest";
import { Plugin, parseAst } from "vite";
import PhosphorUnplugin from "../src/index";

describe("react", () => {
  const plugin = PhosphorUnplugin.vite.bind({ parse: parseAst })({
    framework: "react",
  }) as Plugin<any>;

  it("performs simple replacement", async () => {
    const code = `\
    import { Smiley } from "@phosphor-icons/react";

    export default function App() {
      return <Smiley size={180} color="yellow" />;
    }
    `;

    console.log(parseAst);

    // @ts-expect-error
    const transformed = await plugin.transform(code, "code.tsx");
    console.log(transformed.code);
  });
});
