// vite.config.ts
import { defineConfig } from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/vite@5.2.11/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@3.1.0_svelte@4.2.15_vite@5.2.11/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import Inspect from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/vite-plugin-inspect@0.8.4_vite@5.2.11/node_modules/vite-plugin-inspect/dist/index.mjs";

// ../../src/vite.ts
import { createVitePlugin } from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/unplugin@1.5.1/node_modules/unplugin/dist/index.mjs";

// ../../src/index.ts
import { stringify } from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/svgson@5.3.1/node_modules/svgson/dist/svgson.cjs.js";
import {
  createUnplugin
} from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/unplugin@1.5.1/node_modules/unplugin/dist/index.mjs";

// ../../src/frameworks/react.ts
import MagicString from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/magic-string@0.30.10/node_modules/magic-string/dist/magic-string.es.mjs";
import { parse } from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/svgson@5.3.1/node_modules/svgson/dist/svgson.cjs.js";

// ../../src/frameworks/utils.ts
import fs from "node:fs";
import { createRequire } from "node:module";
var __vite_injected_original_import_meta_url = "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/src/frameworks/utils.ts";
var require2 = createRequire(__vite_injected_original_import_meta_url);
function isModuleDeclaration(node) {
  return node.type === "ImportDeclaration";
}
function readIconSource(kebabName, weight) {
  const url = require2.resolve(
    `../../node_modules/@phosphor-icons/core/assets/${weight}/${kebabName}${weight === "regular" ? "" : `-${weight}`}.svg`
  );
  return fs.readFileSync(url);
}
async function findImports(ast, packageName) {
  const { walk } = await import("file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/estree-walker@3.0.3/node_modules/estree-walker/src/index.js");
  const declarations = [];
  walk(ast, {
    enter(node) {
      if (isModuleDeclaration(node) && node.source.value.startsWith(packageName)) {
        declarations.push(node);
      }
    }
  });
  return declarations;
}
function specifierNames(specifiers) {
  return specifiers.filter(
    (node) => node.specifiers.every((s) => s.type === "ImportSpecifier")
  ).map((node) => node.specifiers).flat().map((spec) => ({
    local: spec.local.name,
    imported: spec.imported.name,
    kebab: spec.imported.name.replace(/([a-z0–9])([A-Z])/g, "$1-$2").toLowerCase()
  }));
}

// ../../src/frameworks/react.ts
var TARGET_MODULE_ID = "@phosphor-icons/react";
var transformInclude = (id) => {
  return /\.(tsx?|jsx)$/.test(id);
};
function transformer(spriteSheet, assetPath, packageName = TARGET_MODULE_ID) {
  return async function(code, _id) {
    const ast = this.parse(code);
    const phosphorImports = await findImports(
      ast,
      packageName
    );
    if (phosphorImports.length === 0)
      return;
    const source = new MagicString(code);
    for (const name of specifierNames(phosphorImports)) {
      const uses = await findIcons(ast, name.local);
      for (const expr of uses) {
        const { weight, color, size, mirrored, props } = extractIconProps(expr);
        const iconId = expr.arguments[0];
        const propsExpr = expr.arguments[1];
        source.update(iconId.start, iconId.end, `"svg"`);
        const colorValue = color?.value?.value ?? "currentColor";
        if (color)
          source.update(
            color.start,
            color.end,
            `color: "${colorValue}"`
          );
        const sizeValue = size?.value?.value ?? "1em";
        if (size) {
          source.update(
            size.start,
            size.end,
            `width: "${sizeValue}", height: "${sizeValue}"`
          );
        } else {
          source.appendRight(
            propsExpr.start + 1,
            `width: "1em", height: "1em", `
          );
        }
        const weightValue = weight?.value?.value?.toString() ?? "regular";
        if (weight) {
          source.remove(weight.start, weight.end + 1);
        }
        const svg = readIconSource(name.kebab, weightValue).toString();
        const svgObj = await parse(svg);
        svgObj.name = "symbol";
        svgObj.attributes.id = `${name.kebab}-${weightValue}`;
        delete svgObj.attributes.xmlns;
        spriteSheet.children.push(svgObj);
        source.update(
          propsExpr.start,
          propsExpr.start + 1,
          `{ children: /* @__PURE__ */ jsx("use", { href: "${assetPath}#${name.kebab}-${weightValue}" }),`
        );
      }
    }
    for (const ii of phosphorImports) {
      source.remove(ii.start, ii.end);
    }
    return {
      code: source.toString(),
      map: source.generateMap({})
    };
  };
}
function extractIconProps(ce) {
  const props = ce.arguments.find(
    (node) => node.type === "ObjectExpression"
  )?.properties ?? [];
  const weight = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "weight"
  );
  const color = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "color"
  );
  const size = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "size"
  );
  const mirrored = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "mirrored"
  );
  return { weight, color, size, mirrored, props };
}
async function findIcons(ast, name) {
  const { walk } = await import("file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/estree-walker@3.0.3/node_modules/estree-walker/src/index.js");
  const icons = [];
  walk(ast, {
    enter(node, _parent, _key, _index) {
      if (node.type === "CallExpression") {
        if (node.callee.type === "Identifier" && (node.callee.name === "jsx" || node.callee.name === "jsxDEV")) {
          if (node.arguments.some(
            (node2) => node2.type === "Identifier" && node2.name === name
          )) {
            icons.push(node);
          }
        }
      }
    }
  });
  return icons;
}

// ../../src/frameworks/svelte.ts
import MagicString2 from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/magic-string@0.30.10/node_modules/magic-string/dist/magic-string.es.mjs";
import { parse as parse2 } from "file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/svgson@5.3.1/node_modules/svgson/dist/svgson.cjs.js";
var TARGET_MODULE_ID2 = "phosphor-svelte";
var transformInclude2 = (id) => {
  return /\.svelte$/.test(id);
};
function transformer2(spriteSheet, assetPath, packageName = TARGET_MODULE_ID2) {
  return async function(code, _id) {
    const ast = this.parse(code);
    const phosphorImports = await findImports(
      ast,
      packageName
    );
    if (phosphorImports.length === 0)
      return;
    const svelteInternals = new Set(
      specifierNames(
        await findImports(ast, "svelte/internal")
      ).map((name) => name.imported)
    );
    const source = new MagicString2(code);
    for (const name of specifierNames(phosphorImports)) {
      const locs = await findSourceLocations(
        ast,
        name.local
      );
      if (!locs)
        continue;
      const { weight, color, size, mirrored, rest } = extractIconProps2(locs);
      const colorValue = color?.value?.value ?? "currentColor";
      const sizeValue = size?.value?.value ?? "1em";
      const mirrorValue = mirrored?.value?.value ?? false;
      const weightValue = weight?.value?.value?.toString() ?? "regular";
      let useVar = `${locs.varName}use`;
      const useUrl = `${assetPath}#${name.kebab}-${weightValue}`;
      source.appendLeft(locs.assignment.start, `let ${useVar};
`);
      source.remove(
        locs.assignment.start,
        locs.assignment.end
      );
      if (locs.create) {
        if (!svelteInternals.has("element")) {
          source.prepend(`import { element } from "svelte/internal";
`);
          svelteInternals.add("element");
        }
        if (!svelteInternals.has("attr")) {
          source.prepend(`import { attr } from "svelte/internal";
`);
          svelteInternals.add("attr");
        }
        if (!svelteInternals.has("svg_element")) {
          source.prepend(`import { svg_element } from "svelte/internal";
`);
          svelteInternals.add("svg_element");
        }
        source.update(
          locs.create.start,
          locs.create.end,
          `${locs.varName} = svg_element("svg");
          ${useVar} = svg_element("use");
          attr(${locs.varName}, "color", "${colorValue}");
          attr(${locs.varName}, "width", "${sizeValue}");
          attr(${locs.varName}, "height", "${sizeValue}");
          ${mirrorValue ? `attr(${locs.varName}, "style", "transform: scale(-1, 1)");` : ""}
          ${rest.map(
            (prop) => `attr(${locs.varName}, "${prop.key.name}", "${prop.value.value}");`
          ).join("\n")}
          attr(${useVar}, "href", "${useUrl}");
          `
        );
      }
      if (locs.claim) {
        if (!svelteInternals.has("claim_element")) {
          source.prepend(`import { claim_element } from "svelte/internal";
`);
          svelteInternals.add("claim_element");
        }
        const parentLocationName = locs.claim.expression.arguments[1]?.name;
        if (parentLocationName) {
          source.update(
            locs.claim.start,
            locs.claim.end,
            `${locs.varName} = claim_element(${parentLocationName}, "SVG", { xmlns: true });`
          );
        }
      }
      if (locs.hydrate) {
      }
      if (locs.mount) {
        if (!svelteInternals.has("append")) {
          source.prepend(`import { append } from "svelte/internal";
`);
          svelteInternals.add("append");
        }
        const parentLocationName = locs.mount.expression.arguments[1]?.name;
        if (parentLocationName) {
          source.update(
            locs.mount.start,
            locs.mount.end,
            `append(${parentLocationName}, ${locs.varName});
          append(${locs.varName}, ${useVar});
          `
          );
        }
        if (locs.update) {
        }
        if (locs.in) {
          source.remove(locs.in.start, locs.in.end);
        }
        if (locs.out) {
          source.remove(locs.out.start, locs.out.end);
        }
        if (locs.destroy) {
          source.remove(locs.destroy.start, locs.destroy.end);
        }
      }
      const svg = readIconSource(name.kebab, weightValue).toString();
      const svgObj = await parse2(svg);
      svgObj.name = "symbol";
      svgObj.attributes.id = `${name.kebab}-${weightValue}`;
      delete svgObj.attributes.xmlns;
      spriteSheet.children.push(svgObj);
    }
    for (const ii of phosphorImports) {
      source.remove(ii.start, ii.end);
    }
    console.log(source.toString());
    return {
      code: source.toString(),
      map: source.generateMap({})
    };
  };
}
async function findSourceLocations(ast, name) {
  const { walk } = await import("file:///C:/Users/fried/Documents/Dev/phosphor-unplugin/node_modules/.pnpm/estree-walker@3.0.3/node_modules/estree-walker/src/index.js");
  let icon = null;
  function findCreateNode(ast2, varName) {
    let createNode = null;
    walk(ast2, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement")
          return;
        const expression = node.expression;
        if (expression.type !== "CallExpression")
          return;
        if (expression.callee.type !== "Identifier" || expression.callee.name !== "create_component")
          return;
        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression")
          return;
        if (!(arg.object.type === "MemberExpression" && arg.object.object.type === "Identifier" && arg.object.object.name === varName && arg.object.property.type === "Identifier" && arg.object.property.name === "$$" && arg.property.type === "Identifier" && arg.property.name === "fragment"))
          return;
        createNode = node;
      }
    });
    return createNode;
  }
  function findClaimNode(ast2, varName) {
    let claimNode = null;
    walk(ast2, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement")
          return;
        const expression = node.expression;
        if (expression.type !== "CallExpression")
          return;
        if (expression.callee.type !== "Identifier" || expression.callee.name !== "claim_component")
          return;
        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression")
          return;
        if (!(arg.object.type === "MemberExpression" && arg.object.object.type === "Identifier" && arg.object.object.name === varName && arg.object.property.type === "Identifier" && arg.object.property.name === "$$" && arg.property.type === "Identifier" && arg.property.name === "fragment"))
          return;
        claimNode = node;
      }
    });
    return claimNode;
  }
  function findMountNode(ast2, varName) {
    let mountNode = null;
    walk(ast2, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement")
          return;
        const expression = node.expression;
        if (expression.type !== "CallExpression")
          return;
        if (expression.callee.type !== "Identifier" || expression.callee.name !== "mount_component")
          return;
        if (expression.arguments[0].type !== "Identifier" || expression.arguments[0].name !== varName)
          return;
        mountNode = node;
      }
    });
    return mountNode;
  }
  function findtransitionInNode(ast2, varName) {
    let transitionInNode = null;
    walk(ast2, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement")
          return;
        const expression = node.expression;
        if (expression.type !== "CallExpression")
          return;
        if (expression.callee.type !== "Identifier" || expression.callee.name !== "transition_in")
          return;
        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression")
          return;
        if (!(arg.object.type === "MemberExpression" && arg.object.object.type === "Identifier" && arg.object.object.name === varName && arg.object.property.type === "Identifier" && arg.object.property.name === "$$" && arg.property.type === "Identifier" && arg.property.name === "fragment"))
          return;
        transitionInNode = node;
      }
    });
    return transitionInNode;
  }
  function findtransitionOutNode(ast2, varName) {
    let transitionOutNode = null;
    walk(ast2, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement")
          return;
        const expression = node.expression;
        if (expression.type !== "CallExpression")
          return;
        if (expression.callee.type !== "Identifier" || expression.callee.name !== "transition_out")
          return;
        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression")
          return;
        if (!(arg.object.type === "MemberExpression" && arg.object.object.type === "Identifier" && arg.object.object.name === varName && arg.object.property.type === "Identifier" && arg.object.property.name === "$$" && arg.property.type === "Identifier" && arg.property.name === "fragment"))
          return;
        transitionOutNode = node;
      }
    });
    return transitionOutNode;
  }
  function findDestroyNode(ast2, varName) {
    let destroyNode = null;
    walk(ast2, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement")
          return;
        const expression = node.expression;
        if (expression.type !== "CallExpression")
          return;
        if (expression.callee.type !== "Identifier" || expression.callee.name !== "destroy_component")
          return;
        const arg = expression.arguments[0];
        if (arg.type !== "Identifier" || arg.name !== varName)
          return;
        destroyNode = node;
      }
    });
    return destroyNode;
  }
  walk(ast, {
    enter(node, _parent, _key, _index) {
      if (node.type !== "ExpressionStatement")
        return;
      if (node.expression.type !== "AssignmentExpression")
        return;
      if (node.expression.right.type !== "NewExpression")
        return;
      if (node.expression.right.callee.type === "Identifier" && node.expression.right.callee.name === name) {
        const varName = node.expression.left.name;
        icon = {
          varName,
          assignment: node,
          create: findCreateNode(ast, varName),
          claim: findClaimNode(ast, varName),
          hydrate: null,
          mount: findMountNode(ast, varName),
          update: null,
          in: findtransitionInNode(ast, varName),
          out: findtransitionOutNode(ast, varName),
          destroy: findDestroyNode(ast, varName)
        };
      }
    }
  });
  return icon;
}
function extractIconProps2(ir) {
  const props = ir.assignment.expression.right.arguments[0].properties[0].value.properties;
  const weight = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "weight"
  );
  const color = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "color"
  );
  const size = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "size"
  );
  const mirrored = props.find(
    (node) => node.type === "Property" && node.key.type === "Identifier" && node.key.name === "mirrored"
  );
  const rest = props.filter(
    (prop) => ![weight, color, size, mirrored].includes(prop)
  );
  return { weight, color, size, mirrored, rest };
}

// ../../src/index.ts
var transformer3 = {
  react: transformer,
  svelte: transformer2,
  vue: () => () => void 0
};
var transformInclude3 = {
  react: transformInclude,
  svelte: transformInclude2,
  vue: (id) => /\.vue$/.test(id)
};
var unpluginFactory = ({
  framework = "react",
  assetPath = "phosphor.svg",
  packageName
} = {}) => {
  const spriteSheet = {
    name: "svg",
    type: "element",
    value: "",
    attributes: { xmlns: "http://www.w3.org/2000/svg" },
    children: []
  };
  if (assetPath.startsWith("/"))
    assetPath = assetPath.slice(1);
  return {
    name: "@phosphor-icons/unplugin",
    apply: "build",
    transformInclude: transformInclude3[framework],
    transform: transformer3[framework].bind(void 0)(
      spriteSheet,
      assetPath,
      packageName
    ),
    buildEnd() {
      this.emitFile({
        fileName: assetPath,
        needsCodeReference: false,
        source: stringify(spriteSheet),
        type: "asset"
      });
    }
  };
};

// ../../src/vite.ts
var vite_default = createVitePlugin(unpluginFactory);

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    svelte(),
    Inspect(),
    vite_default({
      framework: "svelte",
      assetPath: "phosphor.svg",
      packageName: "phosphor-svelte"
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiLi4vLi4vc3JjL3ZpdGUudHMiLCAiLi4vLi4vc3JjL2luZGV4LnRzIiwgIi4uLy4uL3NyYy9mcmFtZXdvcmtzL3JlYWN0LnRzIiwgIi4uLy4uL3NyYy9mcmFtZXdvcmtzL3V0aWxzLnRzIiwgIi4uLy4uL3NyYy9mcmFtZXdvcmtzL3N2ZWx0ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyaWVkXFxcXERvY3VtZW50c1xcXFxEZXZcXFxccGhvc3Bob3ItdW5wbHVnaW5cXFxccGxheWdyb3VuZFxcXFxzdmVsdGUtdml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxwbGF5Z3JvdW5kXFxcXHN2ZWx0ZS12aXRlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9mcmllZC9Eb2N1bWVudHMvRGV2L3Bob3NwaG9yLXVucGx1Z2luL3BsYXlncm91bmQvc3ZlbHRlLXZpdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIjtcbmltcG9ydCBJbnNwZWN0IGZyb20gXCJ2aXRlLXBsdWdpbi1pbnNwZWN0XCI7XG5pbXBvcnQgUGhvc3Bob3JVbnBsdWdpbiBmcm9tIFwiLi4vLi4vc3JjL3ZpdGVcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzdmVsdGUoKSxcbiAgICBJbnNwZWN0KCksXG4gICAgUGhvc3Bob3JVbnBsdWdpbih7XG4gICAgICBmcmFtZXdvcms6IFwic3ZlbHRlXCIsXG4gICAgICBhc3NldFBhdGg6IFwicGhvc3Bob3Iuc3ZnXCIsXG4gICAgICBwYWNrYWdlTmFtZTogXCJwaG9zcGhvci1zdmVsdGVcIixcbiAgICB9KSxcbiAgXSxcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxmcmllZFxcXFxEb2N1bWVudHNcXFxcRGV2XFxcXHBob3NwaG9yLXVucGx1Z2luXFxcXHNyY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxzcmNcXFxcdml0ZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJpZWQvRG9jdW1lbnRzL0Rldi9waG9zcGhvci11bnBsdWdpbi9zcmMvdml0ZS50c1wiO2ltcG9ydCB7IGNyZWF0ZVZpdGVQbHVnaW4gfSBmcm9tIFwidW5wbHVnaW5cIjtcbmltcG9ydCB7IHVucGx1Z2luRmFjdG9yeSB9IGZyb20gXCIuXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVZpdGVQbHVnaW4odW5wbHVnaW5GYWN0b3J5KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxzcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyaWVkXFxcXERvY3VtZW50c1xcXFxEZXZcXFxccGhvc3Bob3ItdW5wbHVnaW5cXFxcc3JjXFxcXGluZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9mcmllZC9Eb2N1bWVudHMvRGV2L3Bob3NwaG9yLXVucGx1Z2luL3NyYy9pbmRleC50c1wiO2ltcG9ydCB7IHN0cmluZ2lmeSwgdHlwZSBJTm9kZSB9IGZyb20gXCJzdmdzb25cIjtcbmltcG9ydCB7XG4gIGNyZWF0ZVVucGx1Z2luLFxuICB0eXBlIFVucGx1Z2luRmFjdG9yeSxcbiAgdHlwZSBVbnBsdWdpbk9wdGlvbnMsXG59IGZyb20gXCJ1bnBsdWdpblwiO1xuXG5pbXBvcnQge1xuICB0cmFuc2Zvcm1lciBhcyByZWFjdFRyYW5zZm9ybWVyLFxuICB0cmFuc2Zvcm1JbmNsdWRlIGFzIHJlYWN0VHJhbnNmb3JtSW5jbHVkZSxcbn0gZnJvbSBcIi4vZnJhbWV3b3Jrcy9yZWFjdFwiO1xuaW1wb3J0IHtcbiAgdHJhbnNmb3JtZXIgYXMgc3ZlbHRlVHJhbnNmb3JtZXIsXG4gIHRyYW5zZm9ybUluY2x1ZGUgYXMgc3ZlbHRlVHJhbnNmb3JtSW5jbHVkZSxcbn0gZnJvbSBcIi4vZnJhbWV3b3Jrcy9zdmVsdGVcIjtcbmltcG9ydCB0eXBlIHsgT3B0aW9ucywgRnJhbWV3b3JrLCBUcmFuc2Zvcm1lciB9IGZyb20gXCIuL3R5cGVzXCI7XG5leHBvcnQgdHlwZSB7IE9wdGlvbnMsIEZyYW1ld29yayB9O1xuXG5jb25zdCB0cmFuc2Zvcm1lcjogUmVjb3JkPEZyYW1ld29yaywgTm9uTnVsbGFibGU8VHJhbnNmb3JtZXI+PiA9IHtcbiAgcmVhY3Q6IHJlYWN0VHJhbnNmb3JtZXIsXG4gIHN2ZWx0ZTogc3ZlbHRlVHJhbnNmb3JtZXIsXG4gIHZ1ZTogKCkgPT4gKCkgPT4gdW5kZWZpbmVkLFxufTtcblxuY29uc3QgdHJhbnNmb3JtSW5jbHVkZTogUmVjb3JkPEZyYW1ld29yaywgVW5wbHVnaW5PcHRpb25zW1widHJhbnNmb3JtSW5jbHVkZVwiXT4gPVxuICB7XG4gICAgcmVhY3Q6IHJlYWN0VHJhbnNmb3JtSW5jbHVkZSxcbiAgICBzdmVsdGU6IHN2ZWx0ZVRyYW5zZm9ybUluY2x1ZGUsXG4gICAgdnVlOiAoaWQpID0+IC9cXC52dWUkLy50ZXN0KGlkKSxcbiAgfTtcblxuZXhwb3J0IGNvbnN0IHVucGx1Z2luRmFjdG9yeTogVW5wbHVnaW5GYWN0b3J5PE9wdGlvbnMgfCB1bmRlZmluZWQ+ID0gKHtcbiAgZnJhbWV3b3JrID0gXCJyZWFjdFwiLFxuICBhc3NldFBhdGggPSBcInBob3NwaG9yLnN2Z1wiLFxuICBwYWNrYWdlTmFtZSxcbn0gPSB7fSkgPT4ge1xuICBjb25zdCBzcHJpdGVTaGVldDogSU5vZGUgPSB7XG4gICAgbmFtZTogXCJzdmdcIixcbiAgICB0eXBlOiBcImVsZW1lbnRcIixcbiAgICB2YWx1ZTogXCJcIixcbiAgICBhdHRyaWJ1dGVzOiB7IHhtbG5zOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgfSxcbiAgICBjaGlsZHJlbjogW10sXG4gIH07XG5cbiAgaWYgKGFzc2V0UGF0aC5zdGFydHNXaXRoKFwiL1wiKSkgYXNzZXRQYXRoID0gYXNzZXRQYXRoLnNsaWNlKDEpO1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJAcGhvc3Bob3ItaWNvbnMvdW5wbHVnaW5cIixcbiAgICBhcHBseTogXCJidWlsZFwiLFxuICAgIHRyYW5zZm9ybUluY2x1ZGU6IHRyYW5zZm9ybUluY2x1ZGVbZnJhbWV3b3JrXSxcbiAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybWVyW2ZyYW1ld29ya10uYmluZCh0aGlzKShcbiAgICAgIHNwcml0ZVNoZWV0LFxuICAgICAgYXNzZXRQYXRoLFxuICAgICAgcGFja2FnZU5hbWVcbiAgICApLFxuICAgIGJ1aWxkRW5kKCkge1xuICAgICAgdGhpcy5lbWl0RmlsZSh7XG4gICAgICAgIGZpbGVOYW1lOiBhc3NldFBhdGgsXG4gICAgICAgIG5lZWRzQ29kZVJlZmVyZW5jZTogZmFsc2UsXG4gICAgICAgIHNvdXJjZTogc3RyaW5naWZ5KHNwcml0ZVNoZWV0KSxcbiAgICAgICAgdHlwZTogXCJhc3NldFwiLFxuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCB1bnBsdWdpbiA9IC8qICNfX1BVUkVfXyAqLyBjcmVhdGVVbnBsdWdpbih1bnBsdWdpbkZhY3RvcnkpO1xuXG5leHBvcnQgZGVmYXVsdCB1bnBsdWdpbjtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxzcmNcXFxcZnJhbWV3b3Jrc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxzcmNcXFxcZnJhbWV3b3Jrc1xcXFxyZWFjdC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJpZWQvRG9jdW1lbnRzL0Rldi9waG9zcGhvci11bnBsdWdpbi9zcmMvZnJhbWV3b3Jrcy9yZWFjdC50c1wiO2ltcG9ydCB0eXBlIEUgZnJvbSBcImVzdHJlZVwiO1xyXG5pbXBvcnQgTWFnaWNTdHJpbmcgZnJvbSBcIm1hZ2ljLXN0cmluZ1wiO1xyXG5pbXBvcnQgeyBwYXJzZSwgdHlwZSBJTm9kZSB9IGZyb20gXCJzdmdzb25cIjtcclxuaW1wb3J0IHR5cGUgeyBVbnBsdWdpbk9wdGlvbnMgfSBmcm9tIFwidW5wbHVnaW5cIjtcclxuaW1wb3J0IHsgZmluZEltcG9ydHMsIHNwZWNpZmllck5hbWVzLCByZWFkSWNvblNvdXJjZSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5jb25zdCBUQVJHRVRfTU9EVUxFX0lEID0gXCJAcGhvc3Bob3ItaWNvbnMvcmVhY3RcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB0cmFuc2Zvcm1JbmNsdWRlOiBVbnBsdWdpbk9wdGlvbnNbXCJ0cmFuc2Zvcm1JbmNsdWRlXCJdID0gKGlkKSA9PiB7XHJcbiAgcmV0dXJuIC9cXC4odHN4P3xqc3gpJC8udGVzdChpZCk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtZXIoXHJcbiAgc3ByaXRlU2hlZXQ6IElOb2RlLFxyXG4gIGFzc2V0UGF0aDogc3RyaW5nLFxyXG4gIHBhY2thZ2VOYW1lOiBzdHJpbmcgPSBUQVJHRVRfTU9EVUxFX0lEXHJcbik6IE5vbk51bGxhYmxlPFVucGx1Z2luT3B0aW9uc1tcInRyYW5zZm9ybVwiXT4ge1xyXG4gIHJldHVybiBhc3luYyBmdW5jdGlvbiAoY29kZSwgX2lkKSB7XHJcbiAgICBjb25zdCBhc3QgPSB0aGlzLnBhcnNlKGNvZGUpO1xyXG4gICAgY29uc3QgcGhvc3Bob3JJbXBvcnRzID0gYXdhaXQgZmluZEltcG9ydHMoXHJcbiAgICAgIGFzdCBhcyBhbnkgYXMgRS5Qcm9ncmFtLFxyXG4gICAgICBwYWNrYWdlTmFtZVxyXG4gICAgKTtcclxuICAgIGlmIChwaG9zcGhvckltcG9ydHMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gICAgY29uc3Qgc291cmNlID0gbmV3IE1hZ2ljU3RyaW5nKGNvZGUpO1xyXG4gICAgZm9yIChjb25zdCBuYW1lIG9mIHNwZWNpZmllck5hbWVzKHBob3NwaG9ySW1wb3J0cykpIHtcclxuICAgICAgY29uc3QgdXNlcyA9IGF3YWl0IGZpbmRJY29ucyhhc3QgYXMgdW5rbm93biBhcyBFLlByb2dyYW0sIG5hbWUubG9jYWwpO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBleHByIG9mIHVzZXMpIHtcclxuICAgICAgICBjb25zdCB7IHdlaWdodCwgY29sb3IsIHNpemUsIG1pcnJvcmVkLCBwcm9wcyB9ID0gZXh0cmFjdEljb25Qcm9wcyhleHByKTtcclxuICAgICAgICBjb25zdCBpY29uSWQgPSBleHByLmFyZ3VtZW50c1swXSBhcyBFLklkZW50aWZpZXI7XHJcbiAgICAgICAgY29uc3QgcHJvcHNFeHByID0gZXhwci5hcmd1bWVudHNbMV0gYXMgRS5PYmplY3RFeHByZXNzaW9uO1xyXG5cclxuICAgICAgICBzb3VyY2UudXBkYXRlKChpY29uSWQgYXMgYW55KS5zdGFydCwgKGljb25JZCBhcyBhbnkpLmVuZCwgYFwic3ZnXCJgKTtcclxuXHJcbiAgICAgICAgY29uc3QgY29sb3JWYWx1ZSA9IChjb2xvcj8udmFsdWUgYXMgRS5MaXRlcmFsKT8udmFsdWUgPz8gXCJjdXJyZW50Q29sb3JcIjtcclxuICAgICAgICBpZiAoY29sb3IpXHJcbiAgICAgICAgICBzb3VyY2UudXBkYXRlKFxyXG4gICAgICAgICAgICAoY29sb3IgYXMgYW55KS5zdGFydCxcclxuICAgICAgICAgICAgKGNvbG9yIGFzIGFueSkuZW5kLFxyXG4gICAgICAgICAgICBgY29sb3I6IFwiJHtjb2xvclZhbHVlfVwiYFxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2l6ZVZhbHVlID0gKHNpemU/LnZhbHVlIGFzIEUuTGl0ZXJhbCk/LnZhbHVlID8/IFwiMWVtXCI7XHJcbiAgICAgICAgaWYgKHNpemUpIHtcclxuICAgICAgICAgIHNvdXJjZS51cGRhdGUoXHJcbiAgICAgICAgICAgIChzaXplIGFzIGFueSkuc3RhcnQsXHJcbiAgICAgICAgICAgIChzaXplIGFzIGFueSkuZW5kLFxyXG4gICAgICAgICAgICBgd2lkdGg6IFwiJHtzaXplVmFsdWV9XCIsIGhlaWdodDogXCIke3NpemVWYWx1ZX1cImBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNvdXJjZS5hcHBlbmRSaWdodChcclxuICAgICAgICAgICAgKHByb3BzRXhwciBhcyBhbnkpLnN0YXJ0ICsgMSxcclxuICAgICAgICAgICAgYHdpZHRoOiBcIjFlbVwiLCBoZWlnaHQ6IFwiMWVtXCIsIGBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3ZWlnaHRWYWx1ZSA9XHJcbiAgICAgICAgICAod2VpZ2h0Py52YWx1ZSBhcyBFLkxpdGVyYWwpPy52YWx1ZT8udG9TdHJpbmcoKSA/PyBcInJlZ3VsYXJcIjtcclxuICAgICAgICBpZiAod2VpZ2h0KSB7XHJcbiAgICAgICAgICBzb3VyY2UucmVtb3ZlKCh3ZWlnaHQgYXMgYW55KS5zdGFydCwgKHdlaWdodCBhcyBhbnkpLmVuZCArIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3ZnID0gcmVhZEljb25Tb3VyY2UobmFtZS5rZWJhYiwgd2VpZ2h0VmFsdWUpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc3Qgc3ZnT2JqID0gYXdhaXQgcGFyc2Uoc3ZnKTtcclxuICAgICAgICBzdmdPYmoubmFtZSA9IFwic3ltYm9sXCI7XHJcbiAgICAgICAgc3ZnT2JqLmF0dHJpYnV0ZXMuaWQgPSBgJHtuYW1lLmtlYmFifS0ke3dlaWdodFZhbHVlfWA7XHJcbiAgICAgICAgZGVsZXRlIHN2Z09iai5hdHRyaWJ1dGVzLnhtbG5zO1xyXG5cclxuICAgICAgICBzcHJpdGVTaGVldC5jaGlsZHJlbi5wdXNoKHN2Z09iaik7XHJcblxyXG4gICAgICAgIHNvdXJjZS51cGRhdGUoXHJcbiAgICAgICAgICAocHJvcHNFeHByIGFzIGFueSkuc3RhcnQsXHJcbiAgICAgICAgICAocHJvcHNFeHByIGFzIGFueSkuc3RhcnQgKyAxLFxyXG4gICAgICAgICAgYFxcXHJcbnsgY2hpbGRyZW46IC8qIEBfX1BVUkVfXyAqLyBqc3goXCJ1c2VcIiwgeyBocmVmOiBcIiR7YXNzZXRQYXRofSMke25hbWUua2ViYWJ9LSR7d2VpZ2h0VmFsdWV9XCIgfSksYFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGlpIG9mIHBob3NwaG9ySW1wb3J0cykge1xyXG4gICAgICBzb3VyY2UucmVtb3ZlKChpaSBhcyBhbnkpLnN0YXJ0LCAoaWkgYXMgYW55KS5lbmQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvZGU6IHNvdXJjZS50b1N0cmluZygpLFxyXG4gICAgICBtYXA6IHNvdXJjZS5nZW5lcmF0ZU1hcCh7fSksXHJcbiAgICB9O1xyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4dHJhY3RJY29uUHJvcHMoY2U6IEUuQ2FsbEV4cHJlc3Npb24pOiB7XHJcbiAgd2VpZ2h0PzogRS5Qcm9wZXJ0eTtcclxuICBjb2xvcj86IEUuUHJvcGVydHk7XHJcbiAgc2l6ZT86IEUuUHJvcGVydHk7XHJcbiAgbWlycm9yZWQ/OiBFLlByb3BlcnR5O1xyXG4gIHByb3BzOiBFLlByb3BlcnR5W107XHJcbn0ge1xyXG4gIGNvbnN0IHByb3BzID1cclxuICAgIChcclxuICAgICAgY2UuYXJndW1lbnRzLmZpbmQoXHJcbiAgICAgICAgKG5vZGUpID0+IG5vZGUudHlwZSA9PT0gXCJPYmplY3RFeHByZXNzaW9uXCJcclxuICAgICAgKSBhcyBFLk9iamVjdEV4cHJlc3Npb24gfCBudWxsXHJcbiAgICApPy5wcm9wZXJ0aWVzID8/IFtdO1xyXG4gIGNvbnN0IHdlaWdodCA9IHByb3BzLmZpbmQoXHJcbiAgICAobm9kZSkgPT5cclxuICAgICAgbm9kZS50eXBlID09PSBcIlByb3BlcnR5XCIgJiZcclxuICAgICAgbm9kZS5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgbm9kZS5rZXkubmFtZSA9PT0gXCJ3ZWlnaHRcIlxyXG4gICkgYXMgRS5Qcm9wZXJ0eSB8IHVuZGVmaW5lZDtcclxuICBjb25zdCBjb2xvciA9IHByb3BzLmZpbmQoXHJcbiAgICAobm9kZSkgPT5cclxuICAgICAgbm9kZS50eXBlID09PSBcIlByb3BlcnR5XCIgJiZcclxuICAgICAgbm9kZS5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgbm9kZS5rZXkubmFtZSA9PT0gXCJjb2xvclwiXHJcbiAgKSBhcyBFLlByb3BlcnR5IHwgdW5kZWZpbmVkO1xyXG4gIGNvbnN0IHNpemUgPSBwcm9wcy5maW5kKFxyXG4gICAgKG5vZGUpID0+XHJcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJQcm9wZXJ0eVwiICYmXHJcbiAgICAgIG5vZGUua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgIG5vZGUua2V5Lm5hbWUgPT09IFwic2l6ZVwiXHJcbiAgKSBhcyBFLlByb3BlcnR5IHwgdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG1pcnJvcmVkID0gcHJvcHMuZmluZChcclxuICAgIChub2RlKSA9PlxyXG4gICAgICBub2RlLnR5cGUgPT09IFwiUHJvcGVydHlcIiAmJlxyXG4gICAgICBub2RlLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxyXG4gICAgICBub2RlLmtleS5uYW1lID09PSBcIm1pcnJvcmVkXCJcclxuICApIGFzIEUuUHJvcGVydHkgfCB1bmRlZmluZWQ7XHJcbiAgcmV0dXJuIHsgd2VpZ2h0LCBjb2xvciwgc2l6ZSwgbWlycm9yZWQsIHByb3BzOiBwcm9wcyBhcyBFLlByb3BlcnR5W10gfTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZmluZEljb25zKFxyXG4gIGFzdDogRS5Ob2RlLFxyXG4gIG5hbWU6IHN0cmluZ1xyXG4pOiBQcm9taXNlPEUuQ2FsbEV4cHJlc3Npb25bXT4ge1xyXG4gIGNvbnN0IHsgd2FsayB9ID0gYXdhaXQgaW1wb3J0KFwiZXN0cmVlLXdhbGtlclwiKTtcclxuICBjb25zdCBpY29uczogRS5DYWxsRXhwcmVzc2lvbltdID0gW107XHJcblxyXG4gIHdhbGsoYXN0LCB7XHJcbiAgICBlbnRlcihub2RlLCBfcGFyZW50LCBfa2V5LCBfaW5kZXgpIHtcclxuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJDYWxsRXhwcmVzc2lvblwiKSB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgbm9kZS5jYWxsZWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgICAgIChub2RlLmNhbGxlZS5uYW1lID09PSBcImpzeFwiIHx8IG5vZGUuY2FsbGVlLm5hbWUgPT09IFwianN4REVWXCIpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIG5vZGUuYXJndW1lbnRzLnNvbWUoXHJcbiAgICAgICAgICAgICAgKG5vZGUpID0+IG5vZGUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiYgbm9kZS5uYW1lID09PSBuYW1lXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICBpY29ucy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGljb25zO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxzcmNcXFxcZnJhbWV3b3Jrc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZnJpZWRcXFxcRG9jdW1lbnRzXFxcXERldlxcXFxwaG9zcGhvci11bnBsdWdpblxcXFxzcmNcXFxcZnJhbWV3b3Jrc1xcXFx1dGlscy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZnJpZWQvRG9jdW1lbnRzL0Rldi9waG9zcGhvci11bnBsdWdpbi9zcmMvZnJhbWV3b3Jrcy91dGlscy50c1wiO2ltcG9ydCBmcyBmcm9tIFwibm9kZTpmc1wiO1xyXG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSBcIm5vZGU6bW9kdWxlXCI7XHJcbmltcG9ydCB0eXBlIEUgZnJvbSBcImVzdHJlZVwiO1xyXG5cclxuY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc01vZHVsZURlY2xhcmF0aW9uKG5vZGU6IEUuTm9kZSk6IG5vZGUgaXMgRS5JbXBvcnREZWNsYXJhdGlvbiB7XHJcbiAgcmV0dXJuIG5vZGUudHlwZSA9PT0gXCJJbXBvcnREZWNsYXJhdGlvblwiO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEljb25Tb3VyY2Uoa2ViYWJOYW1lOiBzdHJpbmcsIHdlaWdodDogc3RyaW5nKTogQnVmZmVyIHtcclxuICBjb25zdCB1cmwgPSByZXF1aXJlLnJlc29sdmUoXHJcbiAgICBgLi4vLi4vbm9kZV9tb2R1bGVzL0BwaG9zcGhvci1pY29ucy9jb3JlL2Fzc2V0cy8ke3dlaWdodH0vJHtrZWJhYk5hbWV9JHtcclxuICAgICAgd2VpZ2h0ID09PSBcInJlZ3VsYXJcIiA/IFwiXCIgOiBgLSR7d2VpZ2h0fWBcclxuICAgIH0uc3ZnYFxyXG4gICk7XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyh1cmwpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmluZEltcG9ydHMoXHJcbiAgYXN0OiBFLlByb2dyYW0sXHJcbiAgcGFja2FnZU5hbWU6IHN0cmluZ1xyXG4pOiBQcm9taXNlPEUuSW1wb3J0RGVjbGFyYXRpb25bXT4ge1xyXG4gIGNvbnN0IHsgd2FsayB9ID0gYXdhaXQgaW1wb3J0KFwiZXN0cmVlLXdhbGtlclwiKTtcclxuICBjb25zdCBkZWNsYXJhdGlvbnM6IEUuSW1wb3J0RGVjbGFyYXRpb25bXSA9IFtdO1xyXG4gIHdhbGsoYXN0LCB7XHJcbiAgICBlbnRlcihub2RlKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICBpc01vZHVsZURlY2xhcmF0aW9uKG5vZGUpICYmXHJcbiAgICAgICAgKG5vZGUuc291cmNlLnZhbHVlIGFzIHN0cmluZykuc3RhcnRzV2l0aChwYWNrYWdlTmFtZSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgZGVjbGFyYXRpb25zLnB1c2gobm9kZSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfSk7XHJcbiAgcmV0dXJuIGRlY2xhcmF0aW9ucztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNwZWNpZmllck5hbWVzKHNwZWNpZmllcnM6IEUuSW1wb3J0RGVjbGFyYXRpb25bXSkge1xyXG4gIHJldHVybiBzcGVjaWZpZXJzXHJcbiAgICAuZmlsdGVyKChub2RlKSA9PlxyXG4gICAgICBub2RlLnNwZWNpZmllcnMuZXZlcnkoKHMpID0+IHMudHlwZSA9PT0gXCJJbXBvcnRTcGVjaWZpZXJcIilcclxuICAgIClcclxuICAgIC5tYXAoKG5vZGUpID0+IG5vZGUuc3BlY2lmaWVycyBhcyBFLkltcG9ydFNwZWNpZmllcltdKVxyXG4gICAgLmZsYXQoKVxyXG4gICAgLm1hcCgoc3BlYykgPT4gKHtcclxuICAgICAgbG9jYWw6IHNwZWMubG9jYWwubmFtZSxcclxuICAgICAgaW1wb3J0ZWQ6IHNwZWMuaW1wb3J0ZWQubmFtZSxcclxuICAgICAga2ViYWI6IHNwZWMuaW1wb3J0ZWQubmFtZVxyXG4gICAgICAgIC5yZXBsYWNlKC8oW2EtejBcdTIwMTM5XSkoW0EtWl0pL2csIFwiJDEtJDJcIilcclxuICAgICAgICAudG9Mb3dlckNhc2UoKSxcclxuICAgIH0pKTtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyaWVkXFxcXERvY3VtZW50c1xcXFxEZXZcXFxccGhvc3Bob3ItdW5wbHVnaW5cXFxcc3JjXFxcXGZyYW1ld29ya3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGZyaWVkXFxcXERvY3VtZW50c1xcXFxEZXZcXFxccGhvc3Bob3ItdW5wbHVnaW5cXFxcc3JjXFxcXGZyYW1ld29ya3NcXFxcc3ZlbHRlLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9mcmllZC9Eb2N1bWVudHMvRGV2L3Bob3NwaG9yLXVucGx1Z2luL3NyYy9mcmFtZXdvcmtzL3N2ZWx0ZS50c1wiO2ltcG9ydCB0eXBlIEUgZnJvbSBcImVzdHJlZVwiO1xyXG5pbXBvcnQgTWFnaWNTdHJpbmcgZnJvbSBcIm1hZ2ljLXN0cmluZ1wiO1xyXG5pbXBvcnQgeyBwYXJzZSwgdHlwZSBJTm9kZSB9IGZyb20gXCJzdmdzb25cIjtcclxuaW1wb3J0IHR5cGUgeyBVbnBsdWdpbk9wdGlvbnMgfSBmcm9tIFwidW5wbHVnaW5cIjtcclxuaW1wb3J0IHsgZmluZEltcG9ydHMsIHNwZWNpZmllck5hbWVzLCByZWFkSWNvblNvdXJjZSB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5jb25zdCBUQVJHRVRfTU9EVUxFX0lEID0gXCJwaG9zcGhvci1zdmVsdGVcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB0cmFuc2Zvcm1JbmNsdWRlOiBVbnBsdWdpbk9wdGlvbnNbXCJ0cmFuc2Zvcm1JbmNsdWRlXCJdID0gKGlkKSA9PiB7XHJcbiAgcmV0dXJuIC9cXC5zdmVsdGUkLy50ZXN0KGlkKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1lcihcclxuICBzcHJpdGVTaGVldDogSU5vZGUsXHJcbiAgYXNzZXRQYXRoOiBzdHJpbmcsXHJcbiAgcGFja2FnZU5hbWU6IHN0cmluZyA9IFRBUkdFVF9NT0RVTEVfSURcclxuKTogTm9uTnVsbGFibGU8VW5wbHVnaW5PcHRpb25zW1widHJhbnNmb3JtXCJdPiB7XHJcbiAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIChjb2RlLCBfaWQpIHtcclxuICAgIGNvbnN0IGFzdCA9IHRoaXMucGFyc2UoY29kZSk7XHJcbiAgICBjb25zdCBwaG9zcGhvckltcG9ydHMgPSBhd2FpdCBmaW5kSW1wb3J0cyhcclxuICAgICAgYXN0IGFzIGFueSBhcyBFLlByb2dyYW0sXHJcbiAgICAgIHBhY2thZ2VOYW1lXHJcbiAgICApO1xyXG4gICAgaWYgKHBob3NwaG9ySW1wb3J0cy5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgICBjb25zdCBzdmVsdGVJbnRlcm5hbHMgPSBuZXcgU2V0KFxyXG4gICAgICBzcGVjaWZpZXJOYW1lcyhcclxuICAgICAgICBhd2FpdCBmaW5kSW1wb3J0cyhhc3QgYXMgYW55IGFzIEUuUHJvZ3JhbSwgXCJzdmVsdGUvaW50ZXJuYWxcIilcclxuICAgICAgKS5tYXAoKG5hbWUpID0+IG5hbWUuaW1wb3J0ZWQpXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHNvdXJjZSA9IG5ldyBNYWdpY1N0cmluZyhjb2RlKTtcclxuICAgIGZvciAoY29uc3QgbmFtZSBvZiBzcGVjaWZpZXJOYW1lcyhwaG9zcGhvckltcG9ydHMpKSB7XHJcbiAgICAgIGNvbnN0IGxvY3MgPSBhd2FpdCBmaW5kU291cmNlTG9jYXRpb25zKFxyXG4gICAgICAgIGFzdCBhcyB1bmtub3duIGFzIEUuUHJvZ3JhbSxcclxuICAgICAgICBuYW1lLmxvY2FsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoIWxvY3MpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgY29uc3QgeyB3ZWlnaHQsIGNvbG9yLCBzaXplLCBtaXJyb3JlZCwgcmVzdCB9ID0gZXh0cmFjdEljb25Qcm9wcyhsb2NzKTtcclxuXHJcbiAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSAoY29sb3I/LnZhbHVlIGFzIEUuTGl0ZXJhbCk/LnZhbHVlID8/IFwiY3VycmVudENvbG9yXCI7XHJcbiAgICAgIGNvbnN0IHNpemVWYWx1ZSA9IChzaXplPy52YWx1ZSBhcyBFLkxpdGVyYWwpPy52YWx1ZSA/PyBcIjFlbVwiO1xyXG4gICAgICBjb25zdCBtaXJyb3JWYWx1ZSA9IChtaXJyb3JlZD8udmFsdWUgYXMgRS5MaXRlcmFsKT8udmFsdWUgPz8gZmFsc2U7XHJcbiAgICAgIGNvbnN0IHdlaWdodFZhbHVlID1cclxuICAgICAgICAod2VpZ2h0Py52YWx1ZSBhcyBFLkxpdGVyYWwpPy52YWx1ZT8udG9TdHJpbmcoKSA/PyBcInJlZ3VsYXJcIjtcclxuXHJcbiAgICAgIGxldCB1c2VWYXIgPSBgJHtsb2NzLnZhck5hbWV9dXNlYDtcclxuICAgICAgY29uc3QgdXNlVXJsID0gYCR7YXNzZXRQYXRofSMke25hbWUua2ViYWJ9LSR7d2VpZ2h0VmFsdWV9YDtcclxuXHJcbiAgICAgIHNvdXJjZS5hcHBlbmRMZWZ0KChsb2NzLmFzc2lnbm1lbnQgYXMgYW55KS5zdGFydCwgYGxldCAke3VzZVZhcn07XFxuYCk7XHJcbiAgICAgIHNvdXJjZS5yZW1vdmUoXHJcbiAgICAgICAgKGxvY3MuYXNzaWdubWVudCBhcyBhbnkpLnN0YXJ0LFxyXG4gICAgICAgIChsb2NzLmFzc2lnbm1lbnQgYXMgYW55KS5lbmRcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChsb2NzLmNyZWF0ZSkge1xyXG4gICAgICAgIGlmICghc3ZlbHRlSW50ZXJuYWxzLmhhcyhcImVsZW1lbnRcIikpIHtcclxuICAgICAgICAgIHNvdXJjZS5wcmVwZW5kKGBpbXBvcnQgeyBlbGVtZW50IH0gZnJvbSBcInN2ZWx0ZS9pbnRlcm5hbFwiO1xcbmApO1xyXG4gICAgICAgICAgc3ZlbHRlSW50ZXJuYWxzLmFkZChcImVsZW1lbnRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXN2ZWx0ZUludGVybmFscy5oYXMoXCJhdHRyXCIpKSB7XHJcbiAgICAgICAgICBzb3VyY2UucHJlcGVuZChgaW1wb3J0IHsgYXR0ciB9IGZyb20gXCJzdmVsdGUvaW50ZXJuYWxcIjtcXG5gKTtcclxuICAgICAgICAgIHN2ZWx0ZUludGVybmFscy5hZGQoXCJhdHRyXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzdmVsdGVJbnRlcm5hbHMuaGFzKFwic3ZnX2VsZW1lbnRcIikpIHtcclxuICAgICAgICAgIHNvdXJjZS5wcmVwZW5kKGBpbXBvcnQgeyBzdmdfZWxlbWVudCB9IGZyb20gXCJzdmVsdGUvaW50ZXJuYWxcIjtcXG5gKTtcclxuICAgICAgICAgIHN2ZWx0ZUludGVybmFscy5hZGQoXCJzdmdfZWxlbWVudFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNvdXJjZS51cGRhdGUoXHJcbiAgICAgICAgICAobG9jcy5jcmVhdGUgYXMgYW55KS5zdGFydCxcclxuICAgICAgICAgIChsb2NzLmNyZWF0ZSBhcyBhbnkpLmVuZCxcclxuICAgICAgICAgIGAke2xvY3MudmFyTmFtZX0gPSBzdmdfZWxlbWVudChcInN2Z1wiKTtcclxuICAgICAgICAgICR7dXNlVmFyfSA9IHN2Z19lbGVtZW50KFwidXNlXCIpO1xyXG4gICAgICAgICAgYXR0cigke2xvY3MudmFyTmFtZX0sIFwiY29sb3JcIiwgXCIke2NvbG9yVmFsdWV9XCIpO1xyXG4gICAgICAgICAgYXR0cigke2xvY3MudmFyTmFtZX0sIFwid2lkdGhcIiwgXCIke3NpemVWYWx1ZX1cIik7XHJcbiAgICAgICAgICBhdHRyKCR7bG9jcy52YXJOYW1lfSwgXCJoZWlnaHRcIiwgXCIke3NpemVWYWx1ZX1cIik7XHJcbiAgICAgICAgICAke1xyXG4gICAgICAgICAgICBtaXJyb3JWYWx1ZVxyXG4gICAgICAgICAgICAgID8gYGF0dHIoJHtsb2NzLnZhck5hbWV9LCBcInN0eWxlXCIsIFwidHJhbnNmb3JtOiBzY2FsZSgtMSwgMSlcIik7YFxyXG4gICAgICAgICAgICAgIDogXCJcIlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgJHtyZXN0XHJcbiAgICAgICAgICAgIC5tYXAoXHJcbiAgICAgICAgICAgICAgKHByb3ApID0+XHJcbiAgICAgICAgICAgICAgICBgYXR0cigke2xvY3MudmFyTmFtZX0sIFwiJHsocHJvcC5rZXkgYXMgRS5JZGVudGlmaWVyKS5uYW1lfVwiLCBcIiR7XHJcbiAgICAgICAgICAgICAgICAgIChwcm9wLnZhbHVlIGFzIEUuTGl0ZXJhbCkudmFsdWVcclxuICAgICAgICAgICAgICAgIH1cIik7YFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpfVxyXG4gICAgICAgICAgYXR0cigke3VzZVZhcn0sIFwiaHJlZlwiLCBcIiR7dXNlVXJsfVwiKTtcclxuICAgICAgICAgIGBcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobG9jcy5jbGFpbSkge1xyXG4gICAgICAgIGlmICghc3ZlbHRlSW50ZXJuYWxzLmhhcyhcImNsYWltX2VsZW1lbnRcIikpIHtcclxuICAgICAgICAgIHNvdXJjZS5wcmVwZW5kKGBpbXBvcnQgeyBjbGFpbV9lbGVtZW50IH0gZnJvbSBcInN2ZWx0ZS9pbnRlcm5hbFwiO1xcbmApO1xyXG4gICAgICAgICAgc3ZlbHRlSW50ZXJuYWxzLmFkZChcImNsYWltX2VsZW1lbnRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbk5hbWUgPSAoXHJcbiAgICAgICAgICAobG9jcy5jbGFpbS5leHByZXNzaW9uIGFzIEUuQ2FsbEV4cHJlc3Npb24pXHJcbiAgICAgICAgICAgIC5hcmd1bWVudHNbMV0gYXMgRS5JZGVudGlmaWVyXHJcbiAgICAgICAgKT8ubmFtZTtcclxuICAgICAgICBpZiAocGFyZW50TG9jYXRpb25OYW1lKSB7XHJcbiAgICAgICAgICBzb3VyY2UudXBkYXRlKFxyXG4gICAgICAgICAgICAobG9jcy5jbGFpbSBhcyBhbnkpLnN0YXJ0LFxyXG4gICAgICAgICAgICAobG9jcy5jbGFpbSBhcyBhbnkpLmVuZCxcclxuICAgICAgICAgICAgYCR7bG9jcy52YXJOYW1lfSA9IGNsYWltX2VsZW1lbnQoJHtwYXJlbnRMb2NhdGlvbk5hbWV9LCBcIlNWR1wiLCB7IHhtbG5zOiB0cnVlIH0pO2BcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobG9jcy5oeWRyYXRlKSB7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChsb2NzLm1vdW50KSB7XHJcbiAgICAgICAgaWYgKCFzdmVsdGVJbnRlcm5hbHMuaGFzKFwiYXBwZW5kXCIpKSB7XHJcbiAgICAgICAgICBzb3VyY2UucHJlcGVuZChgaW1wb3J0IHsgYXBwZW5kIH0gZnJvbSBcInN2ZWx0ZS9pbnRlcm5hbFwiO1xcbmApO1xyXG4gICAgICAgICAgc3ZlbHRlSW50ZXJuYWxzLmFkZChcImFwcGVuZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uTmFtZSA9IChcclxuICAgICAgICAgIChsb2NzLm1vdW50LmV4cHJlc3Npb24gYXMgRS5DYWxsRXhwcmVzc2lvbilcclxuICAgICAgICAgICAgLmFyZ3VtZW50c1sxXSBhcyBFLklkZW50aWZpZXJcclxuICAgICAgICApPy5uYW1lO1xyXG4gICAgICAgIGlmIChwYXJlbnRMb2NhdGlvbk5hbWUpIHtcclxuICAgICAgICAgIHNvdXJjZS51cGRhdGUoXHJcbiAgICAgICAgICAgIChsb2NzLm1vdW50IGFzIGFueSkuc3RhcnQsXHJcbiAgICAgICAgICAgIChsb2NzLm1vdW50IGFzIGFueSkuZW5kLFxyXG4gICAgICAgICAgICBgYXBwZW5kKCR7cGFyZW50TG9jYXRpb25OYW1lfSwgJHtsb2NzLnZhck5hbWV9KTtcclxuICAgICAgICAgIGFwcGVuZCgke2xvY3MudmFyTmFtZX0sICR7dXNlVmFyfSk7XHJcbiAgICAgICAgICBgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxvY3MudXBkYXRlKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobG9jcy5pbikge1xyXG4gICAgICAgICAgc291cmNlLnJlbW92ZSgobG9jcy5pbiBhcyBhbnkpLnN0YXJ0LCAobG9jcy5pbiBhcyBhbnkpLmVuZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobG9jcy5vdXQpIHtcclxuICAgICAgICAgIHNvdXJjZS5yZW1vdmUoKGxvY3Mub3V0IGFzIGFueSkuc3RhcnQsIChsb2NzLm91dCBhcyBhbnkpLmVuZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobG9jcy5kZXN0cm95KSB7XHJcbiAgICAgICAgICBzb3VyY2UucmVtb3ZlKChsb2NzLmRlc3Ryb3kgYXMgYW55KS5zdGFydCwgKGxvY3MuZGVzdHJveSBhcyBhbnkpLmVuZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdmcgPSByZWFkSWNvblNvdXJjZShuYW1lLmtlYmFiLCB3ZWlnaHRWYWx1ZSkudG9TdHJpbmcoKTtcclxuICAgICAgY29uc3Qgc3ZnT2JqID0gYXdhaXQgcGFyc2Uoc3ZnKTtcclxuICAgICAgc3ZnT2JqLm5hbWUgPSBcInN5bWJvbFwiO1xyXG4gICAgICBzdmdPYmouYXR0cmlidXRlcy5pZCA9IGAke25hbWUua2ViYWJ9LSR7d2VpZ2h0VmFsdWV9YDtcclxuICAgICAgZGVsZXRlIHN2Z09iai5hdHRyaWJ1dGVzLnhtbG5zO1xyXG5cclxuICAgICAgc3ByaXRlU2hlZXQuY2hpbGRyZW4ucHVzaChzdmdPYmopO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3QgaWkgb2YgcGhvc3Bob3JJbXBvcnRzKSB7XHJcbiAgICAgIHNvdXJjZS5yZW1vdmUoKGlpIGFzIGFueSkuc3RhcnQsIChpaSBhcyBhbnkpLmVuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coc291cmNlLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvZGU6IHNvdXJjZS50b1N0cmluZygpLFxyXG4gICAgICBtYXA6IHNvdXJjZS5nZW5lcmF0ZU1hcCh7fSksXHJcbiAgICB9O1xyXG4gIH07XHJcbn1cclxuXHJcbnR5cGUgU3ZlbGV0ZUljb25JUiA9IHtcclxuICB2YXJOYW1lOiBzdHJpbmc7XHJcbiAgYXNzaWdubWVudDogRS5FeHByZXNzaW9uU3RhdGVtZW50O1xyXG4gIGNyZWF0ZTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbDtcclxuICBjbGFpbTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbDtcclxuICBoeWRyYXRlOiBFLkV4cHJlc3Npb25TdGF0ZW1lbnQgfCBudWxsO1xyXG4gIG1vdW50OiBFLkV4cHJlc3Npb25TdGF0ZW1lbnQgfCBudWxsO1xyXG4gIHVwZGF0ZTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbDtcclxuICBpbjogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbDtcclxuICBvdXQ6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGw7XHJcbiAgZGVzdHJveTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbDtcclxufTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRTb3VyY2VMb2NhdGlvbnMoXHJcbiAgYXN0OiBFLk5vZGUsXHJcbiAgbmFtZTogc3RyaW5nXHJcbik6IFByb21pc2U8U3ZlbGV0ZUljb25JUiB8IG51bGw+IHtcclxuICBjb25zdCB7IHdhbGsgfSA9IGF3YWl0IGltcG9ydChcImVzdHJlZS13YWxrZXJcIik7XHJcbiAgbGV0IGljb246IFN2ZWxldGVJY29uSVIgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogTG9jYXRlIHRoZSBjcmVhdGUgbm9kZSBmb3IgYSBnaXZlbiBjb21wb25lbnQgdmFyaWFibGUgbmFtZSwgaWYgaXQgZXhpc3RzLlxyXG4gICAqIEBwYXJhbSBhc3QgdGhlIEFTVCB0byBzZWFyY2hcclxuICAgKiBAcGFyYW0gdmFyTmFtZSB0aGUgZ2VuZXJhdGVkIHZhcmlhYmxlIGlkZW50aWZpZXIgZm9yIHRoZSBjb21wb25lbnRcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBgYGBqc1xyXG4gICAqIGZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudChjdHgpIHtcclxuICAgKiAgICBsZXQgbXlOb2RlOyAvLyA8LS0gdGhpcyBuYW1lXHJcbiAgICpcclxuICAgKiAgICByZXR1cm4ge1xyXG4gICAqICAgICAgYzogZnVuY3Rpb24gY3JlYXRlKG5vZGVzKSB7XHJcbiAgICogICAgICAgIGNyZWF0ZV9jb21wb25lbnQobXlOb2RlLiQkLmZyYWdtZW50KTsgLy8gPC0tIHRoaXMgbm9kZVxyXG4gICAqICAgICAgfSxcclxuICAgKiAgICAgIC8vIC4uLlxyXG4gICAqICAgIH1cclxuICAgKiB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZmluZENyZWF0ZU5vZGUoXHJcbiAgICBhc3Q6IEUuTm9kZSxcclxuICAgIHZhck5hbWU6IHN0cmluZ1xyXG4gICk6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwge1xyXG4gICAgbGV0IGNyZWF0ZU5vZGU6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIHdhbGsoYXN0LCB7XHJcbiAgICAgIGVudGVyKG5vZGUsIF9wYXJlbnQsIF9rZXksIF9pbmRleCkge1xyXG4gICAgICAgIGlmIChub2RlLnR5cGUgIT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBub2RlLmV4cHJlc3Npb247XHJcbiAgICAgICAgaWYgKGV4cHJlc3Npb24udHlwZSAhPT0gXCJDYWxsRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgfHxcclxuICAgICAgICAgIGV4cHJlc3Npb24uY2FsbGVlLm5hbWUgIT09IFwiY3JlYXRlX2NvbXBvbmVudFwiXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBhcmcgPSBleHByZXNzaW9uLmFyZ3VtZW50c1swXTtcclxuICAgICAgICBpZiAoYXJnLnR5cGUgIT09IFwiTWVtYmVyRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgIShcclxuICAgICAgICAgICAgYXJnLm9iamVjdC50eXBlID09PSBcIk1lbWJlckV4cHJlc3Npb25cIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0Lm9iamVjdC50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0Lm9iamVjdC5uYW1lID09PSB2YXJOYW1lICYmXHJcbiAgICAgICAgICAgIGFyZy5vYmplY3QucHJvcGVydHkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgICAgICAgYXJnLm9iamVjdC5wcm9wZXJ0eS5uYW1lID09PSBcIiQkXCIgJiZcclxuICAgICAgICAgICAgYXJnLnByb3BlcnR5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgICAgICAgIGFyZy5wcm9wZXJ0eS5uYW1lID09PSBcImZyYWdtZW50XCJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY3JlYXRlTm9kZSA9IG5vZGU7XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gY3JlYXRlTm9kZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvY2F0ZSB0aGUgY2xhaW0gbm9kZSBmb3IgYSBnaXZlbiBjb21wb25lbnQgdmFyaWFibGUgbmFtZSwgaWYgaXQgZXhpc3RzLlxyXG4gICAqIEBwYXJhbSBhc3QgdGhlIEFTVCB0byBzZWFyY2hcclxuICAgKiBAcGFyYW0gdmFyTmFtZSB0aGUgZ2VuZXJhdGVkIHZhcmlhYmxlIGlkZW50aWZpZXIgZm9yIHRoZSBjb21wb25lbnRcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBgYGBqc1xyXG4gICAqIGZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudChjdHgpIHtcclxuICAgKiAgICBsZXQgZGl2MDtcclxuICAgKiAgICBsZXQgbXlOb2RlOyAvLyA8LS0gdGhpcyBuYW1lXHJcbiAgICpcclxuICAgKiAgICByZXR1cm4ge1xyXG4gICAqICAgICAgbDogZnVuY3Rpb24gY2xhaW0obm9kZXMpIHtcclxuICAgKiAgICAgICAgZGl2MCA9IGNsYWltX2VsZW1lbnQobm9kZXMsIFwiRElWXCIsIHsgY2xhc3M6IHRydWUgfSk7XHJcbiAgICogICAgICAgIHZhciBkaXYwX25vZGVzID0gY2hpbGRyZW4oZGl2MCk7XHJcbiAgICogICAgICAgIGNsYWltX2NvbXBvbmVudChteU5vZGUuJCQuZnJhZ21lbnQsIGRpdjBfbm9kZXMpOyAvLyA8LS0gdGhpcyBub2RlXHJcbiAgICogICAgICB9LFxyXG4gICAqICAgICAgLy8gLi4uXHJcbiAgICogICAgfVxyXG4gICAqIH1cclxuICAgKiBgYGBcclxuICAgKi9cclxuICBmdW5jdGlvbiBmaW5kQ2xhaW1Ob2RlKFxyXG4gICAgYXN0OiBFLk5vZGUsXHJcbiAgICB2YXJOYW1lOiBzdHJpbmdcclxuICApOiBFLkV4cHJlc3Npb25TdGF0ZW1lbnQgfCBudWxsIHtcclxuICAgIGxldCBjbGFpbU5vZGU6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIHdhbGsoYXN0LCB7XHJcbiAgICAgIGVudGVyKG5vZGUsIF9wYXJlbnQsIF9rZXksIF9pbmRleCkge1xyXG4gICAgICAgIGlmIChub2RlLnR5cGUgIT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBub2RlLmV4cHJlc3Npb247XHJcbiAgICAgICAgaWYgKGV4cHJlc3Npb24udHlwZSAhPT0gXCJDYWxsRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgfHxcclxuICAgICAgICAgIGV4cHJlc3Npb24uY2FsbGVlLm5hbWUgIT09IFwiY2xhaW1fY29tcG9uZW50XCJcclxuICAgICAgICApXHJcbiAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGFyZyA9IGV4cHJlc3Npb24uYXJndW1lbnRzWzBdO1xyXG4gICAgICAgIGlmIChhcmcudHlwZSAhPT0gXCJNZW1iZXJFeHByZXNzaW9uXCIpIHJldHVybjtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAhKFxyXG4gICAgICAgICAgICBhcmcub2JqZWN0LnR5cGUgPT09IFwiTWVtYmVyRXhwcmVzc2lvblwiICYmXHJcbiAgICAgICAgICAgIGFyZy5vYmplY3Qub2JqZWN0LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgICAgICAgIGFyZy5vYmplY3Qub2JqZWN0Lm5hbWUgPT09IHZhck5hbWUgJiZcclxuICAgICAgICAgICAgYXJnLm9iamVjdC5wcm9wZXJ0eS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0LnByb3BlcnR5Lm5hbWUgPT09IFwiJCRcIiAmJlxyXG4gICAgICAgICAgICBhcmcucHJvcGVydHkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgICAgICAgYXJnLnByb3BlcnR5Lm5hbWUgPT09IFwiZnJhZ21lbnRcIlxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjbGFpbU5vZGUgPSBub2RlO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGNsYWltTm9kZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvY2F0ZSB0aGUgbW91bnQgbm9kZSBmb3IgYSBnaXZlbiBjb21wb25lbnQgdmFyaWFibGUgbmFtZSwgaWYgaXQgZXhpc3RzLlxyXG4gICAqIEBwYXJhbSBhc3QgdGhlIEFTVCB0byBzZWFyY2hcclxuICAgKiBAcGFyYW0gdmFyTmFtZSB0aGUgZ2VuZXJhdGVkIHZhcmlhYmxlIGlkZW50aWZpZXIgZm9yIHRoZSBjb21wb25lbnRcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBgYGBqc1xyXG4gICAqIGZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudChjdHgpIHtcclxuICAgKiAgICBsZXQgZGl2MDtcclxuICAgKiAgICBsZXQgbXlOb2RlOyAvLyA8LS0gdGhpcyBuYW1lXHJcbiAgICpcclxuICAgKiAgICByZXR1cm4ge1xyXG4gICAqICAgICAgbTogZnVuY3Rpb24gbW91bnQodGFyZ2V0LCBhbmNob3IpIHtcclxuICAgKiAgICAgICAgbW91bnRfY29tcG9uZW50KG15Tm9kZSwgZGl2MCwgbnVsbCk7IC8vIDwtLSB0aGlzIG5vZGVcclxuICAgKiAgICAgIH0sXHJcbiAgICogICAgICAvLyAuLi5cclxuICAgKiAgICB9XHJcbiAgICogfVxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGZpbmRNb3VudE5vZGUoXHJcbiAgICBhc3Q6IEUuTm9kZSxcclxuICAgIHZhck5hbWU6IHN0cmluZ1xyXG4gICk6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwge1xyXG4gICAgbGV0IG1vdW50Tm9kZTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgd2Fsayhhc3QsIHtcclxuICAgICAgZW50ZXIobm9kZSwgX3BhcmVudCwgX2tleSwgX2luZGV4KSB7XHJcbiAgICAgICAgaWYgKG5vZGUudHlwZSAhPT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IG5vZGUuZXhwcmVzc2lvbjtcclxuICAgICAgICBpZiAoZXhwcmVzc2lvbi50eXBlICE9PSBcIkNhbGxFeHByZXNzaW9uXCIpIHJldHVybjtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBleHByZXNzaW9uLmNhbGxlZS50eXBlICE9PSBcIklkZW50aWZpZXJcIiB8fFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5jYWxsZWUubmFtZSAhPT0gXCJtb3VudF9jb21wb25lbnRcIlxyXG4gICAgICAgIClcclxuICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5hcmd1bWVudHNbMF0udHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgfHxcclxuICAgICAgICAgIGV4cHJlc3Npb24uYXJndW1lbnRzWzBdLm5hbWUgIT09IHZhck5hbWVcclxuICAgICAgICApXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgbW91bnROb2RlID0gbm9kZTtcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBtb3VudE5vZGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2NhdGUgdGhlIHRyYW5zaXRpb25faW4gbm9kZSBmb3IgYSBnaXZlbiBjb21wb25lbnQgdmFyaWFibGUgbmFtZSwgaWYgaXQgZXhpc3RzLlxyXG4gICAqIEBwYXJhbSBhc3QgdGhlIEFTVCB0byBzZWFyY2hcclxuICAgKiBAcGFyYW0gdmFyTmFtZSB0aGUgZ2VuZXJhdGVkIHZhcmlhYmxlIGlkZW50aWZpZXIgZm9yIHRoZSBjb21wb25lbnRcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBgYGBqc1xyXG4gICAqIGZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudChjdHgpIHtcclxuICAgKiAgICBsZXQgbXlOb2RlOyAvLyA8LS0gdGhpcyBuYW1lXHJcbiAgICpcclxuICAgKiAgICByZXR1cm4ge1xyXG4gICAqICAgICAgaTogZnVuY3Rpb24gaW4obG9jYWwpIHtcclxuICAgKiAgICAgICAgdHJhbnNpdGlvbl9pbihteU5vZGUuJCQuZnJhZ21lbnQsIGxvY2FsKTsgLy8gPC0tIHRoaXMgbm9kZVxyXG4gICAqICAgICAgfSxcclxuICAgKiAgICAgIC8vIC4uLlxyXG4gICAqICAgIH1cclxuICAgKiB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZmluZHRyYW5zaXRpb25Jbk5vZGUoXHJcbiAgICBhc3Q6IEUuTm9kZSxcclxuICAgIHZhck5hbWU6IHN0cmluZ1xyXG4gICk6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwge1xyXG4gICAgbGV0IHRyYW5zaXRpb25Jbk5vZGU6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIHdhbGsoYXN0LCB7XHJcbiAgICAgIGVudGVyKG5vZGUsIF9wYXJlbnQsIF9rZXksIF9pbmRleCkge1xyXG4gICAgICAgIGlmIChub2RlLnR5cGUgIT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBub2RlLmV4cHJlc3Npb247XHJcbiAgICAgICAgaWYgKGV4cHJlc3Npb24udHlwZSAhPT0gXCJDYWxsRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgfHxcclxuICAgICAgICAgIGV4cHJlc3Npb24uY2FsbGVlLm5hbWUgIT09IFwidHJhbnNpdGlvbl9pblwiXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBhcmcgPSBleHByZXNzaW9uLmFyZ3VtZW50c1swXTtcclxuICAgICAgICBpZiAoYXJnLnR5cGUgIT09IFwiTWVtYmVyRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgIShcclxuICAgICAgICAgICAgYXJnLm9iamVjdC50eXBlID09PSBcIk1lbWJlckV4cHJlc3Npb25cIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0Lm9iamVjdC50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0Lm9iamVjdC5uYW1lID09PSB2YXJOYW1lICYmXHJcbiAgICAgICAgICAgIGFyZy5vYmplY3QucHJvcGVydHkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgICAgICAgYXJnLm9iamVjdC5wcm9wZXJ0eS5uYW1lID09PSBcIiQkXCIgJiZcclxuICAgICAgICAgICAgYXJnLnByb3BlcnR5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgICAgICAgIGFyZy5wcm9wZXJ0eS5uYW1lID09PSBcImZyYWdtZW50XCJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdHJhbnNpdGlvbkluTm9kZSA9IG5vZGU7XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdHJhbnNpdGlvbkluTm9kZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvY2F0ZSB0aGUgdHJhbnNpdGlvbl9pbiBub2RlIGZvciBhIGdpdmVuIGNvbXBvbmVudCB2YXJpYWJsZSBuYW1lLCBpZiBpdCBleGlzdHMuXHJcbiAgICogQHBhcmFtIGFzdCB0aGUgQVNUIHRvIHNlYXJjaFxyXG4gICAqIEBwYXJhbSB2YXJOYW1lIHRoZSBnZW5lcmF0ZWQgdmFyaWFibGUgaWRlbnRpZmllciBmb3IgdGhlIGNvbXBvbmVudFxyXG4gICAqIEByZXR1cm5zXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIGBgYGpzXHJcbiAgICogZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50KGN0eCkge1xyXG4gICAqICAgIGxldCBteU5vZGU7IC8vIDwtLSB0aGlzIG5hbWVcclxuICAgKlxyXG4gICAqICAgIHJldHVybiB7XHJcbiAgICogICAgICBvOiBmdW5jdGlvbiBpbihsb2NhbCkge1xyXG4gICAqICAgICAgICB0cmFuc2l0aW9uX291dChteU5vZGUuJCQuZnJhZ21lbnQsIGxvY2FsKTsgLy8gPC0tIHRoaXMgbm9kZVxyXG4gICAqICAgICAgfSxcclxuICAgKiAgICAgIC8vIC4uLlxyXG4gICAqICAgIH1cclxuICAgKiB9XHJcbiAgICogYGBgXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZmluZHRyYW5zaXRpb25PdXROb2RlKFxyXG4gICAgYXN0OiBFLk5vZGUsXHJcbiAgICB2YXJOYW1lOiBzdHJpbmdcclxuICApOiBFLkV4cHJlc3Npb25TdGF0ZW1lbnQgfCBudWxsIHtcclxuICAgIGxldCB0cmFuc2l0aW9uT3V0Tm9kZTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgd2Fsayhhc3QsIHtcclxuICAgICAgZW50ZXIobm9kZSwgX3BhcmVudCwgX2tleSwgX2luZGV4KSB7XHJcbiAgICAgICAgaWYgKG5vZGUudHlwZSAhPT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IG5vZGUuZXhwcmVzc2lvbjtcclxuICAgICAgICBpZiAoZXhwcmVzc2lvbi50eXBlICE9PSBcIkNhbGxFeHByZXNzaW9uXCIpIHJldHVybjtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBleHByZXNzaW9uLmNhbGxlZS50eXBlICE9PSBcIklkZW50aWZpZXJcIiB8fFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5jYWxsZWUubmFtZSAhPT0gXCJ0cmFuc2l0aW9uX291dFwiXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBhcmcgPSBleHByZXNzaW9uLmFyZ3VtZW50c1swXTtcclxuICAgICAgICBpZiAoYXJnLnR5cGUgIT09IFwiTWVtYmVyRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgIShcclxuICAgICAgICAgICAgYXJnLm9iamVjdC50eXBlID09PSBcIk1lbWJlckV4cHJlc3Npb25cIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0Lm9iamVjdC50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxyXG4gICAgICAgICAgICBhcmcub2JqZWN0Lm9iamVjdC5uYW1lID09PSB2YXJOYW1lICYmXHJcbiAgICAgICAgICAgIGFyZy5vYmplY3QucHJvcGVydHkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgICAgICAgYXJnLm9iamVjdC5wcm9wZXJ0eS5uYW1lID09PSBcIiQkXCIgJiZcclxuICAgICAgICAgICAgYXJnLnByb3BlcnR5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgICAgICAgIGFyZy5wcm9wZXJ0eS5uYW1lID09PSBcImZyYWdtZW50XCJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdHJhbnNpdGlvbk91dE5vZGUgPSBub2RlO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHRyYW5zaXRpb25PdXROb2RlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTG9jYXRlIHRoZSB0cmFuc2l0aW9uX2luIG5vZGUgZm9yIGEgZ2l2ZW4gY29tcG9uZW50IHZhcmlhYmxlIG5hbWUsIGlmIGl0IGV4aXN0cy5cclxuICAgKiBAcGFyYW0gYXN0IHRoZSBBU1QgdG8gc2VhcmNoXHJcbiAgICogQHBhcmFtIHZhck5hbWUgdGhlIGdlbmVyYXRlZCB2YXJpYWJsZSBpZGVudGlmaWVyIGZvciB0aGUgY29tcG9uZW50XHJcbiAgICogQHJldHVybnNcclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogYGBganNcclxuICAgKiBmdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQoY3R4KSB7XHJcbiAgICogICAgbGV0IG15Tm9kZTsgLy8gPC0tIHRoaXMgbmFtZVxyXG4gICAqXHJcbiAgICogICAgcmV0dXJuIHtcclxuICAgKiAgICAgIGQ6IGZ1bmN0aW9uIGRlc3Ryb3koZGV0YWNoaW5nKSB7XHJcbiAgICogICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KG15Tm9kZSk7IC8vIDwtLSB0aGlzIG5vZGVcclxuICAgKiAgICAgIH0sXHJcbiAgICogICAgICAvLyAuLi5cclxuICAgKiAgICB9XHJcbiAgICogfVxyXG4gICAqIGBgYFxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGZpbmREZXN0cm95Tm9kZShcclxuICAgIGFzdDogRS5Ob2RlLFxyXG4gICAgdmFyTmFtZTogc3RyaW5nXHJcbiAgKTogRS5FeHByZXNzaW9uU3RhdGVtZW50IHwgbnVsbCB7XHJcbiAgICBsZXQgZGVzdHJveU5vZGU6IEUuRXhwcmVzc2lvblN0YXRlbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIHdhbGsoYXN0LCB7XHJcbiAgICAgIGVudGVyKG5vZGUsIF9wYXJlbnQsIF9rZXksIF9pbmRleCkge1xyXG4gICAgICAgIGlmIChub2RlLnR5cGUgIT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBub2RlLmV4cHJlc3Npb247XHJcbiAgICAgICAgaWYgKGV4cHJlc3Npb24udHlwZSAhPT0gXCJDYWxsRXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgZXhwcmVzc2lvbi5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIgfHxcclxuICAgICAgICAgIGV4cHJlc3Npb24uY2FsbGVlLm5hbWUgIT09IFwiZGVzdHJveV9jb21wb25lbnRcIlxyXG4gICAgICAgIClcclxuICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgYXJnID0gZXhwcmVzc2lvbi5hcmd1bWVudHNbMF07XHJcbiAgICAgICAgaWYgKGFyZy50eXBlICE9PSBcIklkZW50aWZpZXJcIiB8fCBhcmcubmFtZSAhPT0gdmFyTmFtZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBkZXN0cm95Tm9kZSA9IG5vZGU7XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZGVzdHJveU5vZGU7XHJcbiAgfVxyXG5cclxuICB3YWxrKGFzdCwge1xyXG4gICAgZW50ZXIobm9kZSwgX3BhcmVudCwgX2tleSwgX2luZGV4KSB7XHJcbiAgICAgIGlmIChub2RlLnR5cGUgIT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiKSByZXR1cm47XHJcbiAgICAgIGlmIChub2RlLmV4cHJlc3Npb24udHlwZSAhPT0gXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiKSByZXR1cm47XHJcbiAgICAgIGlmIChub2RlLmV4cHJlc3Npb24ucmlnaHQudHlwZSAhPT0gXCJOZXdFeHByZXNzaW9uXCIpIHJldHVybjtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIG5vZGUuZXhwcmVzc2lvbi5yaWdodC5jYWxsZWUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgICBub2RlLmV4cHJlc3Npb24ucmlnaHQuY2FsbGVlLm5hbWUgPT09IG5hbWVcclxuICAgICAgKSB7XHJcbiAgICAgICAgY29uc3QgdmFyTmFtZSA9IChub2RlLmV4cHJlc3Npb24ubGVmdCBhcyBFLklkZW50aWZpZXIpLm5hbWU7XHJcbiAgICAgICAgaWNvbiA9IHtcclxuICAgICAgICAgIHZhck5hbWUsXHJcbiAgICAgICAgICBhc3NpZ25tZW50OiBub2RlLFxyXG4gICAgICAgICAgY3JlYXRlOiBmaW5kQ3JlYXRlTm9kZShhc3QsIHZhck5hbWUpLFxyXG4gICAgICAgICAgY2xhaW06IGZpbmRDbGFpbU5vZGUoYXN0LCB2YXJOYW1lKSxcclxuICAgICAgICAgIGh5ZHJhdGU6IG51bGwsXHJcbiAgICAgICAgICBtb3VudDogZmluZE1vdW50Tm9kZShhc3QsIHZhck5hbWUpLFxyXG4gICAgICAgICAgdXBkYXRlOiBudWxsLFxyXG4gICAgICAgICAgaW46IGZpbmR0cmFuc2l0aW9uSW5Ob2RlKGFzdCwgdmFyTmFtZSksXHJcbiAgICAgICAgICBvdXQ6IGZpbmR0cmFuc2l0aW9uT3V0Tm9kZShhc3QsIHZhck5hbWUpLFxyXG4gICAgICAgICAgZGVzdHJveTogZmluZERlc3Ryb3lOb2RlKGFzdCwgdmFyTmFtZSksXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGljb247XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4dHJhY3RJY29uUHJvcHMoaXI6IFN2ZWxldGVJY29uSVIpOiB7XHJcbiAgd2VpZ2h0PzogRS5Qcm9wZXJ0eTtcclxuICBjb2xvcj86IEUuUHJvcGVydHk7XHJcbiAgc2l6ZT86IEUuUHJvcGVydHk7XHJcbiAgbWlycm9yZWQ/OiBFLlByb3BlcnR5O1xyXG4gIHJlc3Q6IEUuUHJvcGVydHlbXTtcclxufSB7XHJcbiAgLy8gVE9ETzogZG8gdGhpcyBzYWZlbHlcclxuICBjb25zdCBwcm9wcyA9IChpci5hc3NpZ25tZW50LmV4cHJlc3Npb24gYXMgYW55KS5yaWdodC5hcmd1bWVudHNbMF1cclxuICAgIC5wcm9wZXJ0aWVzWzBdLnZhbHVlLnByb3BlcnRpZXMgYXMgRS5Qcm9wZXJ0eVtdO1xyXG5cclxuICBjb25zdCB3ZWlnaHQgPSBwcm9wcy5maW5kKFxyXG4gICAgKG5vZGUpID0+XHJcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJQcm9wZXJ0eVwiICYmXHJcbiAgICAgIG5vZGUua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgIG5vZGUua2V5Lm5hbWUgPT09IFwid2VpZ2h0XCJcclxuICApIGFzIEUuUHJvcGVydHkgfCB1bmRlZmluZWQ7XHJcbiAgY29uc3QgY29sb3IgPSBwcm9wcy5maW5kKFxyXG4gICAgKG5vZGUpID0+XHJcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJQcm9wZXJ0eVwiICYmXHJcbiAgICAgIG5vZGUua2V5LnR5cGUgPT09IFwiSWRlbnRpZmllclwiICYmXHJcbiAgICAgIG5vZGUua2V5Lm5hbWUgPT09IFwiY29sb3JcIlxyXG4gICkgYXMgRS5Qcm9wZXJ0eSB8IHVuZGVmaW5lZDtcclxuICBjb25zdCBzaXplID0gcHJvcHMuZmluZChcclxuICAgIChub2RlKSA9PlxyXG4gICAgICBub2RlLnR5cGUgPT09IFwiUHJvcGVydHlcIiAmJlxyXG4gICAgICBub2RlLmtleS50eXBlID09PSBcIklkZW50aWZpZXJcIiAmJlxyXG4gICAgICBub2RlLmtleS5uYW1lID09PSBcInNpemVcIlxyXG4gICkgYXMgRS5Qcm9wZXJ0eSB8IHVuZGVmaW5lZDtcclxuICBjb25zdCBtaXJyb3JlZCA9IHByb3BzLmZpbmQoXHJcbiAgICAobm9kZSkgPT5cclxuICAgICAgbm9kZS50eXBlID09PSBcIlByb3BlcnR5XCIgJiZcclxuICAgICAgbm9kZS5rZXkudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIgJiZcclxuICAgICAgbm9kZS5rZXkubmFtZSA9PT0gXCJtaXJyb3JlZFwiXHJcbiAgKSBhcyBFLlByb3BlcnR5IHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdCByZXN0ID0gcHJvcHMuZmlsdGVyKFxyXG4gICAgKHByb3ApID0+ICFbd2VpZ2h0LCBjb2xvciwgc2l6ZSwgbWlycm9yZWRdLmluY2x1ZGVzKHByb3ApXHJcbiAgKTtcclxuXHJcbiAgcmV0dXJuIHsgd2VpZ2h0LCBjb2xvciwgc2l6ZSwgbWlycm9yZWQsIHJlc3QgfTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlaLFNBQVMsb0JBQW9CO0FBQzlhLFNBQVMsY0FBYztBQUN2QixPQUFPLGFBQWE7OztBQ0ZvVCxTQUFTLHdCQUF3Qjs7O0FDQS9CLFNBQVMsaUJBQTZCO0FBQ2hYO0FBQUEsRUFDRTtBQUFBLE9BR0s7OztBQ0pQLE9BQU8saUJBQWlCO0FBQ3hCLFNBQVMsYUFBeUI7OztBQ0YyVSxPQUFPLFFBQVE7QUFDNVgsU0FBUyxxQkFBcUI7QUFENk0sSUFBTSwyQ0FBMkM7QUFJNVIs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QVcsR0FBRztBQUFHLGdCQUFZLFVBQVUsTUFBTSxDQUFDO0FBRTVELFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLGtCQUFrQkEsa0JBQWlCLFNBQVM7QUFBQSxJQUM1QyxXQUFXRCxhQUFZLFNBQVMsRUFBRSxLQUFLLE1BQUk7QUFBQSxNQUN6QztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsV0FBVztBQUNULFdBQUssU0FBUztBQUFBLFFBQ1osVUFBVTtBQUFBLFFBQ1Ysb0JBQW9CO0FBQUEsUUFDcEIsUUFBUSxVQUFVLFdBQVc7QUFBQSxRQUM3QixNQUFNO0FBQUEsTUFDUixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjs7O0FEN0RBLElBQU8sZUFBUSxpQkFBaUIsZUFBZTs7O0FERy9DLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLGFBQWlCO0FBQUEsTUFDZixXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUEsTUFDWCxhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlcXVpcmUiLCAibm9kZSIsICJNYWdpY1N0cmluZyIsICJwYXJzZSIsICJUQVJHRVRfTU9EVUxFX0lEIiwgInRyYW5zZm9ybUluY2x1ZGUiLCAidHJhbnNmb3JtZXIiLCAiTWFnaWNTdHJpbmciLCAiZXh0cmFjdEljb25Qcm9wcyIsICJwYXJzZSIsICJhc3QiLCAidHJhbnNmb3JtZXIiLCAidHJhbnNmb3JtSW5jbHVkZSJdCn0K
