import cheerio from "cheerio";
import { XSSEncode } from "htmlencode";
import marked from "marked";
import sanitizeHtml from "sanitize-html";
import Html from "slate-html-serializer";
import variablePattern from "~/lib/variable-pattern";

marked.setOptions({
  gfm: true,
});

const htmlSerializer = new Html({
  // @ts-ignore
  parseHtml: (html) => {
    const $ = cheerio.load(html);
    return $("body")[0];
  },
  rules: [
    {
      deserialize: (el, next) => {
        const element = (el as unknown) as CheerioElement;
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
          case "blockquote":
          case "img":
            throw new Error(`Tag \`${tagName}\` is not supported`);

          case "ul":
            const nodes = [];

            element.childNodes.forEach((node) => {
              if (node.type === "tag" && node.name === "li") {
                nodes.push(node);
              }
            });

            return {
              nodes: next(nodes),
              object: "block",
              type: "bulleted-list",
            };

          case "li":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "list-item",
            };

          case "code":
            return {
              nodes: next(el.childNodes),
              object: "mark",
              type: "code",
            };

          case "h1":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "heading-one",
            };
          case "h2":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "heading-two",
            };
          case "h3":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "heading-three",
            };
          case "h4":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "heading-four",
            };
          case "h5":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "heading-five",
            };
          case "h6":
            return {
              nodes: next(el.childNodes),
              object: "block",
              type: "heading-six",
            };

          case "a": {
            return {
              data: {
                href: element.attribs.href,
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

          case "variable": {
            const [, value] = element.children[0].data.match(/^\{(.*)\}$/);
            return {
              data: { value },
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

export default (markdown = "") => {
  let isVariable = true;
  let isUnderline = true;

  const html = marked(XSSEncode(markdown), { breaks: true, xhtml: true })
    .replace(/\n/, "")
    .split(variablePattern)
    .reduce((result, value) => {
      // toggle the isVariable flag
      isVariable = !isVariable;

      if (!isVariable) {
        return result + value;
      }

      return result + `<variable>{${value}}</variable>`;
    }, "")
    .split(/\+([^\+]*)\+/)
    .reduce((result, value) => {
      // toggle the isUnderline flag
      isUnderline = !isUnderline;

      if (!isUnderline) {
        return result + value;
      }

      return result + `<u>${value}</u>`;
    }, "")
    .trim();

  return htmlSerializer.deserialize(
    sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "h1",
        "h2",
        "variable",
        "u",
      ]),
    }),
    {
      toJSON: true,
    }
  );
};
