import sanitizeHtml from "sanitize-html";

// Defaults here: https://github.com/apostrophecms/sanitize-html#what-are-the-default-options
const markdownTags = sanitizeHtml.defaults.allowedTags.concat([
  "h1",
  "h2",
  "img",
  "u",
]);

export default markdownTags;
