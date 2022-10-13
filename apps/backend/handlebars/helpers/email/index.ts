import columnWidthHelper from "./column-width";
import courierEmailFooter from "./courier-email-footer";
import courierEmailTextStyleHandlebarsHelper from "./courier-email-text-style";
import courierListChildStylesHandlebarsHelper from "./courier-list-child-styles";
import courierListStylesHandlebarsHelper from "./courier-list-styles";
import courierTemplateBlockHandlebarsTemplate from "./courier-template-block";
import emailMarkdownHandlebarsHelper from "./markdown";
import emailBorderConfigHelper from "./border-config";

const emailHandlebarsHelpers = {
  "border-config": emailBorderConfigHelper,
  "column-width": columnWidthHelper,
  "courier-email-footer": courierEmailFooter,
  "courier-email-text-style": courierEmailTextStyleHandlebarsHelper,
  "courier-list-child-styles": courierListChildStylesHandlebarsHelper,
  "courier-list-styles": courierListStylesHandlebarsHelper,
  "courier-template-block": courierTemplateBlockHandlebarsTemplate,
  markdown: emailMarkdownHandlebarsHelper,
};

export default emailHandlebarsHelpers;
