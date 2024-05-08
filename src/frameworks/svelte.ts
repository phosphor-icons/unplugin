import type E from "estree";
import MagicString from "magic-string";
import { parse, type INode } from "svgson";
import type { UnpluginOptions } from "unplugin";
import { findImports, specifierNames, readIconSource } from "./utils";

const TARGET_MODULE_ID = "phosphor-svelte";

export const transformInclude: UnpluginOptions["transformInclude"] = (id) => {
  return /\.svelte$/.test(id);
};

export function transformer(
  spriteSheet: INode,
  assetPath: string,
  packageName: string = TARGET_MODULE_ID
): NonNullable<UnpluginOptions["transform"]> {
  return async function(code, _id) {
    const loaded: Record<string, Set<string>> = {
      regular: new Set(),
      thin: new Set(),
      light: new Set(),
      bold: new Set(),
      fill: new Set(),
      duotone: new Set(),
    };

    const ast = this.parse(code);
    const phosphorImports = await findImports(
      ast as any as E.Program,
      packageName
    );
    if (phosphorImports.length === 0) return;

    const svelteInternals = new Set(
      specifierNames(
        await findImports(ast as any as E.Program, "svelte/internal")
      ).map((name) => name.imported)
    );

    const source = new MagicString(code);
    for (const name of specifierNames(phosphorImports)) {
      const locs = await findSourceLocations(
        ast as unknown as E.Program,
        name.local
      );

      if (!locs.length) continue;

      for (const icon of locs) {
        // Handle CSR substitution

        if (icon.assignment) {
          let useVar = `${icon.varName}use`;

          source.appendLeft((icon.assignment as any).start, `let ${useVar};\n`);
          source.remove(
            (icon.assignment as any).start,
            (icon.assignment as any).end
          );

          for (const c of icon.create) {
            const { weight, color, size, mirrored, rest } = extractIconProps(
              (icon.assignment!.expression as any).right.arguments[0]
                .properties[0].value.properties
            );

            const colorValue =
              (color?.value as E.Literal)?.value ?? "currentColor";
            const sizeValue = (size?.value as E.Literal)?.value ?? "1em";
            const mirrorValue = (mirrored?.value as E.Literal)?.value ?? false;
            const weightValue =
              (weight?.value as E.Literal)?.value?.toString() ?? "regular";
            const useUrl = `${assetPath}#${name.kebab}-${weightValue}`;

            if (!svelteInternals.has("element")) {
              source.prepend(`import { element } from "svelte/internal";\n`);
              svelteInternals.add("element");
            }

            if (!svelteInternals.has("attr")) {
              source.prepend(`import { attr } from "svelte/internal";\n`);
              svelteInternals.add("attr");
            }

            if (!svelteInternals.has("svg_element")) {
              source.prepend(`import { svg_element } from "svelte/internal";\n`);
              svelteInternals.add("svg_element");
            }

            source.update(
              (c as any).start,
              (c as any).end,
              `${icon.varName} = svg_element("svg");
          ${useVar} = svg_element("use");
          attr(${icon.varName}, "color", "${colorValue}");
          attr(${icon.varName}, "width", "${sizeValue}");
          attr(${icon.varName}, "height", "${sizeValue}");
          ${mirrorValue
                ? `attr(${icon.varName}, "style", "transform: scale(-1, 1)");`
                : ""
              }
          ${rest
                .map(
                  (prop) =>
                    `attr(${icon.varName}, "${(prop.key as E.Identifier).name}", "${(prop.value as E.Literal).value
                    }");`
                )
                .join("\n")}
          attr(${useVar}, "href", "${useUrl}");
          `
            );

            if (!loaded[weightValue]?.has(name.kebab)) {
              const svg = readIconSource(name.kebab, weightValue).toString();
              const svgObj = await parse(svg);
              svgObj.name = "symbol";
              svgObj.attributes.id = `${name.kebab}-${weightValue}`;
              delete svgObj.attributes.xmlns;
              spriteSheet.children.push(svgObj);
            }
          }

          for (const claim of icon.claim) {
            if (!svelteInternals.has("claim_element")) {
              source.prepend(
                `import { claim_element } from "svelte/internal";\n`
              );
              svelteInternals.add("claim_element");
            }

            const parentLocationName = (
              (claim.expression as E.CallExpression).arguments[1] as E.Identifier
            )?.name;
            if (parentLocationName) {
              source.update(
                (claim as any).start,
                (claim as any).end,
                `${icon.varName} = claim_element(${parentLocationName}, "SVG", { xmlns: true });`
              );
            }
          }

          for (const h of icon.hydrate) {
          }

          for (const mount of icon.mount) {
            if (!svelteInternals.has("append")) {
              source.prepend(`import { append } from "svelte/internal";\n`);
              svelteInternals.add("append");
            }

            if (!svelteInternals.has("append_hydration")) {
              source.prepend(`import { append_hydration } from "svelte/internal";\n`);
              svelteInternals.add("append");
            }

            const parentLocationName = (
              (mount.expression as E.CallExpression).arguments[1] as E.Identifier
            )?.name;
            if (parentLocationName) {
              source.update(
                (mount as any).start,
                (mount as any).end,
                `append(${parentLocationName}, ${icon.varName});
          append(${icon.varName}, ${useVar});
          `
              );
            }

            for (const u of icon.update) {
            }

            for (const i of icon.in) {
              source.remove((i as any).start, (i as any).end);
            }

            for (const o of icon.out) {
              source.remove((o as any).start, (o as any).end);
            }

            for (const d of icon.destroy) {
              source.remove((d as any).start, (d as any).end);
            }
          }
        } else {
          // Handle SSR substitution
          for (const call of icon.ssr) {
            const { weight, size, color, mirrored, rest } = extractIconProps(
              call.arguments[0]?.type === "Identifier" && call.arguments[0].name === "$$result" ? call.arguments[1] as E.ObjectExpression : null
            );

            const colorValue =
              (color?.value as E.Literal)?.value ?? "currentColor";
            const sizeValue = (size?.value as E.Literal)?.value ?? "1em";
            const mirrorValue = (mirrored?.value as E.Literal)?.value ?? false;
            const weightValue =
              (weight?.value as E.Literal)?.value?.toString() ?? "regular";
            const useUrl = `${assetPath}#${name.kebab}-${weightValue}`;

            const markup = `\
<svg width="${sizeValue}" height="${sizeValue}" color="${colorValue}" ${mirrorValue ? `style="transform: scale(1, -1);"` : ""} ${rest.map((prop) => `${(prop.key as E.Identifier).name}="${(prop.value as E.Literal).value}"`).join(" ")
              }>
  <use href="${useUrl}" />
</svg>
`;
            source.update((call as any).start - 2, (call as any).end + 1, markup);

            if (!loaded[weightValue]?.has(name.kebab)) {
              const svg = readIconSource(name.kebab, weightValue).toString();
              const svgObj = await parse(svg);
              svgObj.name = "symbol";
              svgObj.attributes.id = `${name.kebab}-${weightValue}`;
              delete svgObj.attributes.xmlns;
              spriteSheet.children.push(svgObj);
            }
          }
        }
      }
    }

    for (const ii of phosphorImports) {
      source.remove((ii as any).start, (ii as any).end);
    }

    console.log(code, source.toString(), JSON.stringify(ast));

    return {
      code: source.toString(),
      map: source.generateMap({}),
    };
  };
}

type SveleteIconIR = {
  varName: string;
  assignment: E.ExpressionStatement | null;
  create: E.ExpressionStatement[];
  claim: E.ExpressionStatement[];
  hydrate: E.ExpressionStatement[];
  mount: E.ExpressionStatement[];
  update: E.ExpressionStatement[];
  in: E.ExpressionStatement[];
  out: E.ExpressionStatement[];
  destroy: E.ExpressionStatement[];
  ssr: E.CallExpression[];
};

/**
 *
 * @param ast the AST to search
 * @param name the imported name of the component
 * @returns
 */
async function findSourceLocations(
  ast: E.Node,
  name: string
): Promise<SveleteIconIR[]> {
  const { walk } = await import("estree-walker");
  const icons: SveleteIconIR[] = [];

  /**
   * Locate the create nodes for a given component variable name.
   *
   * @param ast the AST to search
   * @param varName the generated variable identifier for the component
   * @returns
   *
   * @example
   * ```js
   * function create_fragment(ctx) {
   *    let myNode; // <-- this name
   *
   *    return {
   *      c: function create(nodes) {
   *        create_component(myNode.$$.fragment); // <-- this node
   *      },
   *      // ...
   *    }
   * }
   * ```
   */
  function findCreateNodes(
    ast: E.Node,
    varName: string
  ): E.ExpressionStatement[] {
    const createNodes: E.ExpressionStatement[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement") return;

        const expression = node.expression;
        if (expression.type !== "CallExpression") return;
        if (
          expression.callee.type !== "Identifier" ||
          expression.callee.name !== "create_component"
        )
          return;

        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression") return;
        if (
          !(
            arg.object.type === "MemberExpression" &&
            arg.object.object.type === "Identifier" &&
            arg.object.object.name === varName &&
            arg.object.property.type === "Identifier" &&
            arg.object.property.name === "$$" &&
            arg.property.type === "Identifier" &&
            arg.property.name === "fragment"
          )
        )
          return;
        createNodes.push(node);
      },
    });

    return createNodes;
  }

  /**
   * Locate the claim nodes for a given component variable name.
   *
   * @param ast the AST to search
   * @param varName the generated variable identifier for the component
   * @returns
   *
   * @example
   * ```js
   * function create_fragment(ctx) {
   *    let div0;
   *    let myNode; // <-- this name
   *
   *    return {
   *      l: function claim(nodes) {
   *        div0 = claim_element(nodes, "DIV", { class: true });
   *        var div0_nodes = children(div0);
   *        claim_component(myNode.$$.fragment, div0_nodes); // <-- this node
   *      },
   *      // ...
   *    }
   * }
   * ```
   */
  function findClaimNode(
    ast: E.Node,
    varName: string
  ): E.ExpressionStatement[] {
    const claimNodes: E.ExpressionStatement[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement") return;

        const expression = node.expression;
        if (expression.type !== "CallExpression") return;
        if (
          expression.callee.type !== "Identifier" ||
          expression.callee.name !== "claim_component"
        )
          return;

        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression") return;
        if (
          !(
            arg.object.type === "MemberExpression" &&
            arg.object.object.type === "Identifier" &&
            arg.object.object.name === varName &&
            arg.object.property.type === "Identifier" &&
            arg.object.property.name === "$$" &&
            arg.property.type === "Identifier" &&
            arg.property.name === "fragment"
          )
        )
          return;
        claimNodes.push(node);
      },
    });

    return claimNodes;
  }

  /**
   * Locate the mount nodes for a given component variable name.
   *
   * @param ast the AST to search
   * @param varName the generated variable identifier for the component
   * @returns
   *
   * @example
   * ```js
   * function create_fragment(ctx) {
   *    let div0;
   *    let myNode; // <-- this name
   *
   *    return {
   *      m: function mount(target, anchor) {
   *        mount_component(myNode, div0, null); // <-- this node
   *      },
   *      // ...
   *    }
   * }
   * ```
   */
  function findMountNode(
    ast: E.Node,
    varName: string
  ): E.ExpressionStatement[] {
    const mountNodes: E.ExpressionStatement[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement") return;

        const expression = node.expression;
        if (expression.type !== "CallExpression") return;
        if (
          expression.callee.type !== "Identifier" ||
          expression.callee.name !== "mount_component"
        )
          return;

        if (
          expression.arguments[0].type !== "Identifier" ||
          expression.arguments[0].name !== varName
        )
          return;
        mountNodes.push(node);
      },
    });

    return mountNodes;
  }

  /**
   * Locate the transition_in nodes for a given component variable name.
   *
   * @param ast the AST to search
   * @param varName the generated variable identifier for the component
   * @returns
   *
   * @example
   * ```js
   * function create_fragment(ctx) {
   *    let myNode; // <-- this name
   *
   *    return {
   *      i: function in(local) {
   *        transition_in(myNode.$$.fragment, local); // <-- this node
   *      },
   *      // ...
   *    }
   * }
   * ```
   */
  function findtransitionInNode(
    ast: E.Node,
    varName: string
  ): E.ExpressionStatement[] {
    const transitionInNodes: E.ExpressionStatement[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement") return;

        const expression = node.expression;
        if (expression.type !== "CallExpression") return;
        if (
          expression.callee.type !== "Identifier" ||
          expression.callee.name !== "transition_in"
        )
          return;

        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression") return;
        if (
          !(
            arg.object.type === "MemberExpression" &&
            arg.object.object.type === "Identifier" &&
            arg.object.object.name === varName &&
            arg.object.property.type === "Identifier" &&
            arg.object.property.name === "$$" &&
            arg.property.type === "Identifier" &&
            arg.property.name === "fragment"
          )
        )
          return;
        transitionInNodes.push(node);
      },
    });

    return transitionInNodes;
  }

  /**
   * Locate the transition_in nodes for a given component variable name.
   *
   * @param ast the AST to search
   * @param varName the generated variable identifier for the component
   * @returns
   *
   * @example
   * ```js
   * function create_fragment(ctx) {
   *    let myNode; // <-- this name
   *
   *    return {
   *      o: function in(local) {
   *        transition_out(myNode.$$.fragment, local); // <-- this node
   *      },
   *      // ...
   *    }
   * }
   * ```
   */
  function findtransitionOutNode(
    ast: E.Node,
    varName: string
  ): E.ExpressionStatement[] {
    const transitionOutNodes: E.ExpressionStatement[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement") return;

        const expression = node.expression;
        if (expression.type !== "CallExpression") return;
        if (
          expression.callee.type !== "Identifier" ||
          expression.callee.name !== "transition_out"
        )
          return;

        const arg = expression.arguments[0];
        if (arg.type !== "MemberExpression") return;
        if (
          !(
            arg.object.type === "MemberExpression" &&
            arg.object.object.type === "Identifier" &&
            arg.object.object.name === varName &&
            arg.object.property.type === "Identifier" &&
            arg.object.property.name === "$$" &&
            arg.property.type === "Identifier" &&
            arg.property.name === "fragment"
          )
        )
          return;
        transitionOutNodes.push(node);
      },
    });

    return transitionOutNodes;
  }

  /**
   * Locate the destroy nodes for a given component variable name.
   *
   * @param ast the AST to search
   * @param varName the generated variable identifier for the component
   * @returns
   *
   * @example
   * ```js
   * function create_fragment(ctx) {
   *    let myNode; // <-- this name
   *
   *    return {
   *      d: function destroy(detaching) {
   *        destroy_component(myNode); // <-- this node
   *      },
   *      // ...
   *    }
   * }
   * ```
   */
  function findDestroyNode(
    ast: E.Node,
    varName: string
  ): E.ExpressionStatement[] {
    const destroyNodes: E.ExpressionStatement[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "ExpressionStatement") return;

        const expression = node.expression;
        if (expression.type !== "CallExpression") return;
        if (
          expression.callee.type !== "Identifier" ||
          expression.callee.name !== "destroy_component"
        )
          return;

        const arg = expression.arguments[0];
        if (arg.type !== "Identifier" || arg.name !== varName) return;

        destroyNodes.push(node);
      },
    });

    return destroyNodes;
  }

  async function findSSRLocations(ast: E.Node) {
    const ssrNodes: E.CallExpression[] = [];

    walk(ast, {
      enter(node, _parent, _key, _index) {
        if (node.type !== "TemplateLiteral") return;
        const exprs = node.expressions.filter(
          (expr): expr is E.CallExpression =>
            expr.type === "CallExpression" &&
            expr.callee.type === "MemberExpression" &&
            expr.callee.object.type === "CallExpression" &&
            expr.callee.object.callee.type === "Identifier" &&
            expr.callee.object.callee.name === "validate_component" &&
            expr.callee.object.arguments.some(
              (arg) => arg.type === "Identifier" && arg.name === name
            )
        );
        if (!exprs.length) return;
        ssrNodes.push(...exprs);
      },
    });
    icons.push({
      varName: name,
      assignment: null,
      create: [],
      claim: [],
      mount: [],
      hydrate: [],
      update: [],
      in: [],
      out: [],
      destroy: [],
      ssr: ssrNodes,
    });
  }

  walk(ast, {
    enter(node, _parent, _key, _index) {
      // Handle SSR components separately.
      if (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "create_ssr_component"
      ) {
        findSSRLocations(node);
        return;
      }

      if (node.type !== "ExpressionStatement") return;
      if (node.expression.type !== "AssignmentExpression") return;
      if (node.expression.right.type !== "NewExpression") return;
      if (
        node.expression.right.callee.type === "Identifier" &&
        node.expression.right.callee.name === name
      ) {
        const varName = (node.expression.left as E.Identifier).name;
        icons.push({
          varName,
          assignment: node,
          create: findCreateNodes(ast, varName),
          claim: findClaimNode(ast, varName),
          hydrate: [],
          mount: findMountNode(ast, varName),
          update: [],
          in: findtransitionInNode(ast, varName),
          out: findtransitionOutNode(ast, varName),
          destroy: findDestroyNode(ast, varName),
          ssr: [],
        });
      }
    },
  });

  return icons;
}

function extractIconProps(oe: E.ObjectExpression | null): {
  weight?: E.Property;
  color?: E.Property;
  size?: E.Property;
  mirrored?: E.Property;
  rest: E.Property[];
} {
  // TODO: do this safely
  const props = oe?.properties as E.Property[] ?? [];

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

  const rest = props.filter(
    (prop) => ![weight, color, size, mirrored].includes(prop)
  );

  return { weight, color, size, mirrored, rest };
}
