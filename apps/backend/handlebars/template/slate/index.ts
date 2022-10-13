import { Map } from "immutable";
import { Annotation, Block, Document, Inline, Leaf, Text, Value } from "slate";

import getComplexHandlebarsText from "../generation/get-complex-handlebars-text";
import getHandlebarsText from "../generation/get-handlebars-text";
import getHandlebarsFromSlateBlock from "../nodes/slate/block";
import getHandlebarsFromSlateInline from "../nodes/slate/inline";
import getHandlebarsFromSlateMark from "../nodes/slate/mark";

interface IInternalOptions {
  isComplex?: boolean;
  plain?: boolean;
}

const hasComplexText = (node: Block | Text | Document | Inline): boolean => {
  if (node.object !== "inline") {
    return false;
  }

  switch (node.type) {
    case "link":
    case "variable":
      return true;
  }

  return false;
};

const getHandlebarsFromSlate = (
  slate: Value | undefined,
  options?: { plain?: boolean; allowHbs?: boolean }
): string => {
  if (!slate || typeof slate !== "object") {
    return "";
  }

  const serializeLeaf = (
    node: Leaf,
    leafOptions?: IInternalOptions
  ): string => {
    if (!node.text) {
      return "";
    }
    const textOptions = options?.plain
      ? { lineReturn: "\n", plain: true }
      : undefined;

    const isComplex = leafOptions?.isComplex || options?.allowHbs;

    const text = isComplex
      ? getComplexHandlebarsText(node.text, {
          ...textOptions,
          unsafe: options?.allowHbs,
        }) // will look for {variables}
      : getHandlebarsText(node.text, textOptions); // escape text and handle line returns

    if (!node.marks || options?.plain) {
      return text;
    }

    return node.marks.reduce(
      (childContent: string | undefined, mark): string => {
        const children = childContent || "";

        if (!mark) {
          return children;
        }

        return getHandlebarsFromSlateMark(mark, children);
      },
      text
    );
  };

  const getHandlebarsFromSlateNode = (
    node: Block | Text | Document | Inline,
    options?: IInternalOptions,
    index?: number
  ): string => {
    switch (node.object) {
      case "text":
        const leaves = node.getLeaves(Map<string, Annotation>(), []);

        return leaves
          .map((leaf) => (leaf ? serializeLeaf(leaf, options) : ""))
          .join("");
    }

    const childOptions =
      !options?.isComplex && hasComplexText(node)
        ? { ...options, isComplex: true }
        : options;

    const children = getHandlebarsChildrenFromSlateNode(node, childOptions);

    if (options?.plain && node.type !== "conditional") {
      if (index > 0) {
        return `{{{@lineReturn}}}${children}`;
      }

      return children;
    }

    switch (node.object) {
      case "inline":
        return getHandlebarsFromSlateInline(node, children);
      case "block":
        const block = getHandlebarsFromSlateBlock(node, children);
        if (index > 0) {
          return `{{{@lineReturn}}}${block}`;
        }

        return block;
      default:
        return children;
    }
  };

  const getHandlebarsChildrenFromSlateNode = (
    node: Block | Document | Inline,
    options?: IInternalOptions
  ): string => {
    // immutable seems to have really bad types so just convert it to an array type
    const children = (node.nodes as unknown as Array<Block | Text | Inline>)
      .map((child) => getHandlebarsFromSlateNode(child, options))
      .filter(Boolean)
      .join("");

    return children;
  };

  return slate.document.nodes
    .map((node, index): string => {
      if (!node) {
        return "";
      }

      return getHandlebarsFromSlateNode(node, options, index);
    })
    .filter(Boolean)
    .join("");
};

export default getHandlebarsFromSlate;
