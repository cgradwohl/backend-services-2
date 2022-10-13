import { Value } from "slate";

const serializeNode = (value: Value | undefined, rules): string[] => {
  if (!value) {
    return [""];
  }

  const serializeLeaf = (leaf) => {
    let text = leaf.text;

    for (const rule of rules) {
      if (!rule.serialize) {
        continue;
      }

      const newText = rule.serialize(
        {
          type: "text",
        },
        text
      );

      if (newText) {
        text = newText;
      }
    }

    return leaf.marks.reduce((children, mark) => {
      for (const rule of rules) {
        if (!rule.serialize) {
          continue;
        }

        const ret = rule.serialize(mark, children, leaf);
        if (ret) {
          return ret;
        }
      }
    }, text);
  };

  const serialize = (node) => {
    if (
      node.object === "text" ||
      node.object === "markdown" ||
      node.object === "quote"
    ) {
      return serializeLeaf(node);
    }

    const children = node.nodes
      .map((childNode) => {
        const serialized = serialize(childNode);

        return (
          (serialized && serialized.join ? serialized.join("") : serialized) ||
          ""
        );
      })
      .join(
        // Special case for blockquotes, children in blockquotes are separated by new lines
        node.type === "block-quote" ? "\n" : ""
      );

    let returnValue;
    for (const rule of rules) {
      if (!rule.serialize) {
        continue;
      }

      returnValue = rule.serialize(node, children);

      if (typeof returnValue !== "undefined") {
        break;
      }
    }

    if (typeof returnValue !== "undefined") {
      return returnValue;
    }

    return children;
  };

  return ((value.document.nodes as unknown) as any[]).map((node) =>
    serialize(node)
  );
};

export default serializeNode;
