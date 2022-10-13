import {
  Content,
  ElementalContent,
  ElementalContentSugar,
  ElementalNode,
} from "~/api/send/types";

export function getElementalContent(content: Content): ElementalContent {
  const sugar = transformContentToElementalContent(
    content as ElementalContentSugar
  );

  return {
    version: "2022-01-01",
    elements: [
      // transform ElementalContentSugar ("title" and "body") into ElementalContent, and give them precedence, if they exist
      ...(sugar?.elements ?? []),
      ...((content as ElementalContent)?.elements ?? []),
    ],
  };
}

export function isElementalContent(
  content: Content
): content is ElementalContent {
  return "elements" in content;
}

export function transformContentToElementalContent(
  content: ElementalContentSugar
): ElementalContent {
  const elements: ElementalNode[] = Object.keys(content).reduce(
    (result, key) => {
      if (key === "title") {
        return [
          ...result,
          {
            type: "meta",
            title: content.title,
          },
        ];
      }

      if (key === "body") {
        return [
          ...result,
          {
            type: "text",
            content: content.body,
          },
        ];
      }

      return result;
    },
    []
  );

  return {
    version: "2022-01-01",
    elements,
  };
}

export function getTitle(elements: ElementalNode[]): string {
  for (const element of elements) {
    if (element.type === "meta" && "title" in element) {
      return element.title;
    }
  }
  return "";
}
