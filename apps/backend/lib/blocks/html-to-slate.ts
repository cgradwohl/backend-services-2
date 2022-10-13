import cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { Value } from "slate";
import Html from "slate-html-serializer";

export default (html: string, sourceSlate?: Value) => {
  const getInlineByKey = (key: string) => {
    if (!key) {
      return;
    }

    return sourceSlate?.document?.getInlines()?.find((node) => {
      return node.key === key;
    });
  };

  const getTextByKey = (key: string) => {
    if (!key) {
      return;
    }

    return sourceSlate?.document?.getTexts()?.find((node) => {
      return node.key === key;
    });
  };

  const htmlSerializer = new Html({
    // @ts-ignore
    parseHtml: (html) => {
      const $ = cheerio.load(html);
      return $("body")[0];
    },
    rules: [
      {
        deserialize: (el, next) => {
          const element = el as unknown as CheerioElement;
          const tagName = element.tagName;

          // @ts-ignore
          if (el.type === "text") {
            return {
              object: "text",
              // @ts-ignore
              text: el.data,
            };
          }

          switch (tagName) {
            case "conditional":
            case "highlight": {
              const id = element.attribs.id;
              const matchingInline = getInlineByKey(id);

              return {
                data: {
                  ...matchingInline?.data.toObject(),
                  $sourceId: id,
                },
                nodes: next(el.childNodes),
                object: "inline",
                type: tagName,
              };
            }

            case "a": {
              const id = element.attribs.id;
              const matchingInline = getInlineByKey(id);

              return {
                data: {
                  ...matchingInline?.data.toObject(),
                  $sourceId: id,
                },
                nodes: next(el.childNodes),
                object: "inline",
                type: "link",
              };
            }

            case "em": {
              return {
                nodes: next(el.childNodes),
                object: "mark",
                type: "italic",
              };
            }

            case "p": {
              return {
                nodes: next(el.childNodes),
                object: "block",
                type: "paragraph",
              };
            }

            case "strong": {
              return {
                nodes: next(el.childNodes),
                object: "mark",
                type: "bold",
              };
            }

            case "del": {
              return {
                nodes: next(el.childNodes),
                object: "mark",
                type: "strikethrough",
              };
            }

            case "u": {
              return {
                nodes: next(el.childNodes),
                object: "mark",
                type: "underlined",
              };
            }

            case "text-color": {
              const parentId = element.attribs["parent-id"];
              const parentNode = getTextByKey(parentId);

              const textColorMark = parentNode?.marks?.find((mark) => {
                return mark.type === "textColor";
              });

              return {
                data: {
                  ...textColorMark?.data.toObject(),
                  $sourceParentId: parentId,
                },
                nodes: next(el.childNodes),
                object: "mark",
                type: "textColor",
              };
            }

            case "variable": {
              const id = element.attribs.id;
              let value;
              if (element.children[0].data) {
                const children = element.children[0].data.trim();
                const match = children.match(/^\{(.*)\}$/);
                value = match?.[1];
              }

              const matchingInline = getInlineByKey(id);

              return {
                data: {
                  value,
                  ...matchingInline?.data.toObject(),
                  $sourceId: id,
                },
                nodes: next(el.childNodes),
                object: "inline",
                type: "variable",
              };
            }
          }
        },
      },
    ],
  });

  return htmlSerializer.deserialize(
    sanitizeHtml(html.replace(/(?:\r\n|\r|\n)/g, "<br/>"), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "variable",
        "u",
        "text-color",
        "inline",
        "highlight",
        "conditional",
      ]),
      allowedAttributes: {
        highlight: ["id"],
        conditional: ["id"],
        "text-color": ["parent-id"],
        a: ["id"],
        img: ["id"],
        variable: ["id"],
      },
    }),
    {
      toJSON: true,
    }
  );
};
