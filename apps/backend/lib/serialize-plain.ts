import { ISerializableObject, Serializer } from "./render/blocks";
import serializeNode from "./serialize-node";

const serializer: Serializer = (
  value,
  linkHandler,
  variableReplacer
): string => {
  const links = linkHandler.getScopedHandler("rich-text");
  let linkIndex = 0;

  const serializeRest = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      return children;
    },
  };

  const serializeLink = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "link") {
        return;
      }

      const text = variableReplacer(children.trim());
      const href = links.getHref(
        linkIndex++,
        variableReplacer(obj.data.get("href") || Array.from(children)[0])
      );

      return `${text} (${href})`;
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

  const elements = serializeNode(value, [
    serializeVariable,
    serializeLink,
    serializeRest,
  ]);

  // trim beginning whitespace
  return elements.join("\n").replace(/^\s+/g, "");
};

export default serializer;
