import markdownBold from "./bold.hbs";
import markdownItalic from "./italic.hbs";
import markdownStrikethrough from "./strikethrough.hbs";

const partials = {
  bold: markdownBold,
  italic: markdownItalic,
  strikethrough: markdownStrikethrough,
} as const;

export default partials;
