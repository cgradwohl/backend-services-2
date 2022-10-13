import { ISerializableObject, Serializer } from "./render/blocks";
import serializeNode from "./serialize-node";

const serializer: Serializer = (
  value,
  linkHandler,
  variableReplacer,
  serializerType
): string => {
  const links = linkHandler.getScopedHandler("rich-text");
  let linkIndex = 0;

  const serializeLine = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "line") {
        return;
      }

      return children;
    },
  };

  const serializeLink = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "link") {
        return;
      }

      const rawHref = variableReplacer(
        obj.data.get("href") || Array.from(children)[0]
      );
      const href = links.getHref(linkIndex++, rawHref);
      const text = children.trim()
        ? variableReplacer(children.trim())
        : rawHref;

      if (serializerType === "slack") {
        return `<${href}|${text}>`;
      }

      return `[${text}](${href})`;
    },
  };

  const serializeVariable = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "variable") {
        return;
      }

      return variableReplacer(children).replace(/\r\n/g, "\n");
    },
  };

  const serializationMark = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.object !== "mark") {
        return;
      }

      const trimmed = children.trim();

      if (!children || !trimmed) {
        return children;
      }

      switch (obj.type) {
        case "bold":
          return children.replace(trimmed, `*${trimmed}*`);
        case "strikethrough":
          return children.replace(trimmed, `~${trimmed}~`);
        case "italic":
          return children.replace(trimmed, `_${trimmed}_`);
        case "code":
          return children.replace(trimmed, `\`${trimmed}\``);
        default:
          return children;
      }
    },
  };

  const elements = serializeNode(value, [
    serializeLine,
    serializeVariable,
    serializeLink,
    serializationMark,
  ]);

  // trim beginning whitespace
  return elements.join("\n").replace(/^\s+/g, "");
};

export default serializer;
