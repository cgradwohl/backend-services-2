import { Utils } from "handlebars";

import { ISerializableObject, Serializer } from "./render/blocks";
import serializeNode from "./serialize-node";

const newLineRegex = /(?:\r\n|\n|↵)/;
const serializer: Serializer = (
  value,
  linkHandler,
  variableReplacer
): string => {
  const links = linkHandler.getScopedHandler("rich-text");
  let linkIndex = 0;

  const serializeLine = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "line") {
        return;
      }

      return children.split(newLineRegex).join("<br>");
    },
  };

  const serializeText = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "text") {
        return;
      }

      // XSSEncode removes newlines so split to keep them
      return children
        .split(newLineRegex)
        .map((text) => Utils.escapeExpression(text))
        .join("\n");
    },
  };

  const serializeLink = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "link") {
        return;
      }

      const rawHref = obj.data.get("href") || Array.from(children)[0];
      const text = variableReplacer(children.trim(), true);
      const plainHref = variableReplacer(rawHref);
      const href = links.getHref(linkIndex++, plainHref);

      return `<a href="${Utils.escapeExpression(href)}">${text}</a>`;
    },
  };

  const serializeHighlight = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "highlight") {
        return;
      }

      const color = obj.data.get("color");
      return `<span style="background:${color};padding:0 5px;border-radius:8px;color:white;display:inline-block;">${children}</span>`;
    },
  };

  const serializeVariable = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "variable") {
        return;
      }

      return variableReplacer(children, true);
    },
  };

  const serializationMark = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.object !== "mark") {
        return;
      }

      if (!children) {
        return;
      }

      switch (obj.type) {
        case "textColor":
          return `<span style="color: ${obj.data.get(
            "color"
          )}">${children}</span>`;
        case "bold":
          return `<strong>${children}</strong>`;
        case "italic":
          return `<em>${children}</em>`;
        case "underlined":
          return `<u>${children}</u>`;
        case "strikethrough":
          return `<del>${children}</del>`;
      }
    },
  };

  const serializeBlock = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.object !== "block") {
        return;
      }

      if (!children) {
        return;
      }

      switch (obj.type) {
        case "code":
          return `
            <pre><code>${children}</code></pre>
          `;
        case "line":
        case "paragraph":
          return `<p>${children}</p>`;
        case "quote":
          return `<blockquote>${children}</blockquote>`;
      }
    },
  };

  const elements = serializeNode(value, [
    serializeText,
    serializeLine,
    serializeBlock,
    serializeVariable,
    serializeLink,
    serializeHighlight,
    serializationMark,
  ]);

  return elements.join("<br>");
};

export default serializer;
