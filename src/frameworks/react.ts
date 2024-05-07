import fs from "node:fs";
import type {
  ArrayExpression,
  CallExpression,
  Declaration,
  Expression,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  Literal,
  ModuleDeclaration,
  Node,
  ObjectExpression,
  Program,
  Property,
  SpreadElement,
  Statement,
} from "estree";
import MagicString from "magic-string";
import { parse, type INode } from "svgson";
import type { UnpluginOptions } from "unplugin";

const TARGET_MODULE_ID = "@phosphor-icons/react";

export const transformInclude: UnpluginOptions["transformInclude"] = (id) => {
  return /\.(tsx?|jsx)$/.test(id);
};

export function transformer(
  spriteSheet: INode
): NonNullable<UnpluginOptions["transform"]> {
  return async function (code, _id) {
    const ast = this.parse(code);
    const phosphorImports = (ast as unknown as Program).body.filter(
      (node) =>
        isModuleDeclaration(node) && node.source.value === TARGET_MODULE_ID
    ) as ImportDeclaration[];

    if (phosphorImports.length === 0) return;

    const iconImports: ImportSpecifier[] = phosphorImports
      .filter((node) =>
        node.specifiers.every((s) => s.type === "ImportSpecifier")
      )
      .map((node) => node.specifiers as ImportSpecifier[])
      .flat();
    const names = iconImports.map((spec) => ({
      pascal: spec.local.name,
      kebab: spec.imported.name
        .replace(/([a-z0–9])([A-Z])/g, "$1-$2")
        .toLowerCase(),
    }));
    const jsx = process.env.NODE_ENV === "development" ? "jsxDEV" : "jsx";

    const codemod = new MagicString(code);

    for (const name of names) {
      const uses = findIconJSX((ast as unknown as Program).body, name.pascal);

      for (const expr of uses) {
        const { weight, color, size, mirrored, props } = extractIconProps(expr);
        const iconId = expr.arguments[0] as Identifier;
        const propsExpr = expr.arguments[1] as ObjectExpression;

        codemod.update((iconId as any).start, (iconId as any).end, `"svg"`);

        const colorValue = (color?.value as Literal)?.value ?? "currentColor";
        if (color)
          codemod.update(
            (color as any).start,
            (color as any).end,
            `color: "${colorValue}"`
          );

        const sizeValue = (size?.value as Literal)?.value ?? "1em";
        if (size) {
          codemod.update(
            (size as any).start,
            (size as any).end,
            `width: "${sizeValue}", height: "${sizeValue}"`
          );
        } else {
          codemod.appendRight(
            (propsExpr as any).start + 1,
            `width: "1em", height: "1em", `
          );
        }

        const weightValue = (weight?.value as Literal)?.value ?? "regular";
        if (weight)
          codemod.remove((weight as any).start, (weight as any).end + 1);
        const url = require.resolve(
          `../node_modules/@phosphor-icons/core/assets/${weightValue}/${
            name.kebab
          }${weightValue === "regular" ? "" : `-${weightValue}`}.svg`
        );
        const data = fs.readFileSync(url);
        const svgObj = await parse(data.toString());

        svgObj.name = "symbol";
        svgObj.attributes.id = `${name.kebab}-${weightValue}`;
        delete svgObj.attributes.xmlns;

        spriteSheet.children.push(svgObj);
        // console.log(props);
        // console.log(expr);

        codemod.update(
          (propsExpr as any).start,
          (propsExpr as any).start + 1,
          `\
{ children: /* @__PURE__ */ ${jsx}("use", {
href: "phosphor.svg#${name.kebab}-${weightValue}"
}),`
        );
      }
    }

    for (const ii of phosphorImports) {
      codemod.remove((ii as any).start, (ii as any).end);
    }

    return {
      code: codemod.toString(),
      map: codemod.generateMap({}),
    };
  };
}

function extractIconProps(ce: CallExpression): {
  weight?: Property;
  color?: Property;
  size?: Property;
  mirrored?: Property;
  props: Property[];
} {
  const props =
    (
      ce.arguments.find(
        (node) => node.type === "ObjectExpression"
      ) as ObjectExpression | null
    )?.properties ?? [];
  const weight = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "weight"
  ) as Property | undefined;
  const color = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "color"
  ) as Property | undefined;
  const size = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "size"
  ) as Property | undefined;
  const mirrored = props.find(
    (node) =>
      node.type === "Property" &&
      node.key.type === "Identifier" &&
      node.key.name === "mirrored"
  ) as Property | undefined;
  return { weight, color, size, mirrored, props: props as Property[] };
}

function isModuleDeclaration(
  node: Declaration | Statement | ModuleDeclaration
): node is ImportDeclaration {
  return node.type === "ImportDeclaration";
}

function findIconJSX(ast: Node[], name: string): CallExpression[] {
  return ast.reduce<CallExpression[]>((acc, curr) => {
    switch (curr.type) {
      case "ArrayExpression":
        return acc.concat(
          findIconJSX(
            (curr as ArrayExpression).elements.filter(Boolean) as (
              | Expression
              | SpreadElement
            )[],
            name
          )
        );
      case "ArrowFunctionExpression":
        return acc.concat(findIconJSX([...curr.params, curr.body], name));
      case "AssignmentExpression":
        return acc.concat(findIconJSX([curr.left, curr.right], name));
      case "AwaitExpression":
        return acc.concat(findIconJSX([curr.argument], name));
      case "BinaryExpression":
        return acc.concat(findIconJSX([curr.left, curr.right], name));
      case "BlockStatement":
        return acc.concat(findIconJSX(curr.body, name));
      case "CallExpression": {
        if (
          curr.callee.type === "Identifier" &&
          (curr.callee.name === "jsx" || curr.callee.name === "jsxDEV")
        ) {
          if (
            curr.arguments.some(
              (node) => node.type === "Identifier" && node.name === name
            )
          ) {
            return acc.concat(curr);
          }
        }
        return acc.concat(findIconJSX([curr.callee, ...curr.arguments], name));
      }
      case "ChainExpression":
        return acc.concat(findIconJSX([curr.expression], name));
      case "ClassExpression":
        return acc.concat(findIconJSX(curr.body.body, name));
      case "ConditionalExpression":
        return acc.concat(
          findIconJSX([curr.test, curr.alternate, curr.consequent], name)
        );
      case "ExportDefaultDeclaration":
        return acc.concat(findIconJSX([curr.declaration], name));
      case "ExpressionStatement":
        return acc.concat(findIconJSX([curr.expression], name));
      case "FunctionExpression":
        return acc.concat(findIconJSX([...curr.params, curr.body], name));
      case "FunctionDeclaration":
        return acc.concat(findIconJSX([...curr.params, curr.body], name));
      case "IfStatement":
        return acc.concat(
          findIconJSX(
            [curr.test, curr.consequent, curr.alternate].filter(
              Boolean
            ) as Node[],
            name
          )
        );
      case "NewExpression":
        return acc.concat(findIconJSX([curr.callee, ...curr.arguments], name));
      case "LogicalExpression":
        return acc.concat(findIconJSX([curr.left, curr.right], name));
      case "MemberExpression":
        return acc.concat(findIconJSX([curr.object, curr.property], name));
      case "MetaProperty":
        return acc.concat(findIconJSX([curr.property, curr.meta], name));
      case "ObjectExpression": {
        const props = (curr as ObjectExpression).properties.map((p) => {
          if (p.type === "Property") {
            return p.value;
          } else {
            return p.argument;
          }
        });
        return acc.concat(findIconJSX(props, name));
      }
      case "Property":
        return acc.concat(findIconJSX([curr.value], name));
      case "ReturnStatement":
        if (curr.argument) {
          return acc.concat(findIconJSX([curr.argument], name));
        }
        break;
      case "SequenceExpression":
        throw new Error("SequenceExpression");
      case "ThrowStatement":
        return acc.concat(findIconJSX([curr.argument], name));
      case "UnaryExpression":
        return acc.concat(findIconJSX([curr.argument], name));
      case "UpdateExpression":
        throw new Error("UpdateExpression");
      case "VariableDeclaration": {
        let inits = curr.declarations
          .filter((decl) => decl.init)
          .map((decl) => decl.init!);
        return acc.concat(findIconJSX(inits, name));
      }
      case "WhileStatement":
        return acc.concat(findIconJSX([curr.body], name));
      case "YieldExpression": {
        if (curr.argument)
          return acc.concat(findIconJSX([curr.argument], name));
        break;
      }

      case "Identifier":
      case "ImportDeclaration":
      case "ImportExpression":
      case "Literal":
      case "TaggedTemplateExpression":
      case "TemplateLiteral":
      case "ThisExpression":
        break;

      default:
        throw new Error(curr.type);
    }
    return acc;
  }, []);
}
