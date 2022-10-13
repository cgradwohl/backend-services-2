import { Value } from "slate";
import generateSlateDocument from "~/lib/blocks/generate-slate-document";
import { ISerializableObject } from "~/lib/render/blocks";
import serializeNode from "~/lib/serialize-node";

export default (valueJson: object): string => {
  const value: Value = generateSlateDocument(valueJson);

  const serializeLine = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "line" || !children) {
        return;
      }

      return children;
    },
  };

  const serializeInline = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (!["highlight", "conditional"].includes(obj.type) || !children) {
        return;
      }

      const id = obj.data.get("$sourceId") ?? obj.key;
      return `<${obj.type} id="${id}">${children}</${obj.type}>`;
    },
  };

  const serializeImage = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (!["image"].includes(obj.type)) {
        return;
      }

      const id = obj.data.get("$sourceId") ?? obj.key;
      return `<img id="${id}"/>`;
    },
  };

  const serializeVariable = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "variable" || !children) {
        return;
      }

      const id = obj.data.get("$sourceId") ?? obj.key;
      return `<variable id="${id}">${children}</variable>`;
    },
  };

  const serializeLink = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "link" || !children) {
        return;
      }

      const id = obj.data.get("$sourceId") ?? obj.key;
      return `<a id="${id}">${children}</a>`;
    },
  };

  const serializeMark = {
    serialize(
      obj: ISerializableObject,
      children: string,
      parent: ISerializableObject
    ): React.ReactNode {
      if (obj.object !== "mark" || !children) {
        return;
      }

      switch (obj.type) {
        case "bold":
          return `<strong>${children}</strong>`;
        case "italic":
          return `<em>${children}</em>`;
        case "underlined":
          return `<u>${children}</u>`;
        case "strikethrough":
          return `<u>${children}</u>`;
        case "textColor":
          const parentId = obj.data.get("$sourceParentId") ?? parent.key;
          return `<text-color parent-id="${parentId}">${children}</text-color>`;
        default:
          return children;
      }
    },
  };

  const elements = serializeNode(value, [
    serializeLine,
    serializeLink,
    serializeMark,
    serializeImage,
    serializeInline,
    serializeVariable,
  ]);

  return elements
    .join("\n")
    .replace(/(?:\r\n|\r|\n)/g, "<br/>")
    .trim();
};
