import validLink from "~/lib/valid-link";

const regexMdLinks = /\[([^\[]+)\](\(.*\))/gm;
const singleLinkMatch = /\[([^\[]+)\]\((.*)\)/;
/**
 * Only until we move to nodejs 16.x.x
 */
if (typeof String.prototype.replaceAll == "undefined") {
  String.prototype.replaceAll = function (match, replace) {
    return this.replace(new RegExp(match, "g"), replace);
  };
}

export function replaceMarkdownLinks(
  markdown: string,
  replacerFn: (href, text) => string
): string {
  return markdown.replaceAll(regexMdLinks, (match) => {
    var [, text, href] = singleLinkMatch.exec(match);
    if (validLink(href)) {
      return `[${text}](${replacerFn(href, text)})`;
    }
    return `[${text}](${href})`;
  });
}
