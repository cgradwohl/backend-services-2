import { Value } from "slate";
import { ISerializableObject } from "~/lib/render/blocks";
import serializeNode from "~/lib/serialize-node";

export default (value): string => {
  value = Value.fromJSON(value);
  const serializeLine = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "line") {
        return;
      }

      return children;
    },
  };

  const serializeHeading = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      switch (obj.type) {
        case "heading-one":
          return `# ${children}`;
        case "heading-two":
          return `## ${children}`;
        case "heading-three":
          return `### ${children}`;
        case "heading-four":
          return `#### ${children}`;
        case "heading-five":
          return `##### ${children}`;
        case "heading-six":
          return `###### ${children}`;
      }

      return;
    },
  };

  const serializeLink = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "link") {
        return;
      }

      return `[${children.trim()}](${obj.data.get("href")})`;
    },
  };

  const serializeListItem = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "list-item") {
        return;
      }
      return `- ${children}\n`;
    },
  };

  const serializeVariable = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.type !== "variable") {
        return;
      }

      return children;
    },
  };

  const serializeMark = {
    serialize(obj: ISerializableObject, children: string): React.ReactNode {
      if (obj.object !== "mark") {
        return;
      }

      if (!children) {
        return;
      }

      switch (obj.type) {
        case "bold":
          return children
            .split("\n")
            .map((str) => (str ? `**${str}**` : ""))
            .join("\n");
        case "strikethrough":
          return children
            .split("\n")
            .map((str) => (str ? `~${str}~` : ""))
            .join("\n");
        case "code":
          return children
            .split("\n")
            .map((str) => (str ? `\`${str}\`` : ""))
            .join("\n");
        case "italic":
          return children
            .split("\n")
            .map((str) => (str ? `*${str}*` : ""))
            .join("\n");
        case "underlined":
          return children
            .split("\n")
            .map((str) => (str ? `+${str}+` : ""))
            .join("\n");
        default:
          return children;
      }
    },
  };

  const elements = serializeNode(value, [
    serializeHeading,
    serializeLine,
    serializeLink,
    serializeListItem,
    serializeMark,
    serializeVariable,
  ]);

  return elements.join("\n").trim();
};
