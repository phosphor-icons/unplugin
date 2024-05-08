import fs from "node:fs";
import { createRequire } from "node:module";
import type E from "estree";

const require = createRequire(import.meta.url);

export function isModuleDeclaration(node: E.Node): node is E.ImportDeclaration {
  return node.type === "ImportDeclaration";
}

export function readIconSource(kebabName: string, weight: string): Buffer {
  const url = require.resolve(
    `../../node_modules/@phosphor-icons/core/assets/${weight}/${kebabName}${
      weight === "regular" ? "" : `-${weight}`
    }.svg`
  );
  return fs.readFileSync(url);
}

export async function findImports(
  ast: E.Program,
  packageName: string
): Promise<E.ImportDeclaration[]> {
  const { walk } = await import("estree-walker");
  const declarations: E.ImportDeclaration[] = [];
  walk(ast, {
    enter(node) {
      if (
        isModuleDeclaration(node) &&
        (node.source.value as string).startsWith(packageName)
      ) {
        declarations.push(node);
      }
    },
  });
  return declarations;
}

export function specifierNames(specifiers: E.ImportDeclaration[]) {
  return specifiers
    .filter((node) =>
      node.specifiers.every((s) => s.type === "ImportSpecifier")
    )
    .map((node) => node.specifiers as E.ImportSpecifier[])
    .flat()
    .map((spec) => ({
      local: spec.local.name,
      imported: spec.imported.name,
      kebab: spec.imported.name
        .replace(/([a-z0–9])([A-Z])/g, "$1-$2")
        .toLowerCase(),
    }));
}
