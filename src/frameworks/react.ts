import type E from "estree";
import MagicString from "magic-string";
import { parse, type INode } from "svgson";
import type { UnpluginOptions } from "unplugin";
import { findImports, specifierNames, readIconSource } from "./utils";

const TARGET_MODULE_ID = "@phosphor-icons/react";

export const transformInclude: UnpluginOptions["transformInclude"] = (id) => {
  return /\.(tsx?|jsx)$/.test(id);
};

export function transformer(
  spriteSheet: INode,
  assetPath: string,
  packageName: string = TARGET_MODULE_ID
): NonNullable<UnpluginOptions["transform"]> {
  return async function (code, _id) {
    const ast = this.parse(code);
    const phosphorImports = await findImports(
      ast as any as E.Program,
      packageName
    );
    if (phosphorImports.length === 0) return;

    const source = new MagicString(code);
    for (const name of specifierNames(phosphorImports)) {
      const uses = await findIcons(ast as unknown as E.Program, name.local);

      for (const expr of uses) {
        const { weight, color, size, mirrored, props } = extractIconProps(expr);
        const iconId = expr.arguments[0] as E.Identifier;
        const propsExpr = expr.arguments[1] as E.ObjectExpression;

        source.update((iconId as any).start, (iconId as any).end, `"svg"`);

        const colorValue = (color?.value as E.Literal)?.value ?? "currentColor";
        if (color)
          source.update(
            (color as any).start,
            (color as any).end,
            `color: "${colorValue}"`
          );

        const sizeValue = (size?.value as E.Literal)?.value ?? "1em";
        if (size) {
          source.update(
            (size as any).start,
            (size as any).end,
            `width: "${sizeValue}", height: "${sizeValue}"`
          );
        } else {
          source.appendRight(
            (propsExpr as any).start + 1,
            `width: "1em", height: "1em", `
          );
        }

        const weightValue =
          (weight?.value as E.Literal)?.value?.toString() ?? "regular";
        if (weight) {
          source.remove((weight as any).start, (weight as any).end + 1);
        }

        const svg = readIconSource(name.kebab, weightValue).toString();
        const svgObj = await parse(svg);
        svgObj.name = "symbol";
        svgObj.attributes.id = `${name.kebab}-${weightValue}`;
        delete svgObj.attributes.xmlns;

        spriteSheet.children.push(svgObj);

        source.update(
          (propsExpr as any).start,
          (propsExpr as any).start + 1,
          `\
{ children: /* @__PURE__ */ jsx("use", { href: "${assetPath}#${name.kebab}-${weightValue}" }),`
        );
      }
    }

    for (const ii of phosphorImports) {
      source.remove((ii as any).start, (ii as any).end);
    }

    return {
      code: source.toString(),
      map: source.generateMap({}),
    };
  };
}

function extractIconProps(ce: E.CallExpression): {
  weight?: E.Property;
  color?: E.Property;
  size?: E.Property;
  mirrored?: E.Property;
  props: E.Property[];
} {
  const props =
    (
      ce.arguments.find(
        (node) => node.type === "ObjectExpression"
      ) as E.ObjectExpression | null
    )?.properties ?? [];
  const weight = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "weight"
  ) as E.Property | undefined;
  const color = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "color"
  ) as E.Property | undefined;
  const size = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "size"
  ) as E.Property | undefined;
  const mirrored = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "mirrored"
  ) as E.Property | undefined;
  return { weight, color, size, mirrored, props: props as E.Property[] };
}

async function findIcons(
  ast: E.Node,
  name: string
): Promise<E.CallExpression[]> {
  const { walk } = await import("estree-walker");
  const icons: E.CallExpression[] = [];

  walk(ast, {
    enter(node, _parent, _key, _index) {
      if (node.type === "CallExpression") {
        if (
          node.callee.type === "Identifier" &&
          (node.callee.name === "jsx" || node.callee.name === "jsxDEV")
        ) {
          if (
            node.arguments.some(
              (node) => node.type === "Identifier" && node.name === name
            )
          ) {
            icons.push(node);
          }
        }
      }
    },
  });

  return icons;
}
