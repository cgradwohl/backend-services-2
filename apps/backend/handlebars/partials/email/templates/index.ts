import customEmailTemplate from "./custom";
import lineEmailTemplate from "./line";
import mjmlEmailTemplate from "./mjml";
import noneEmailTemplate from "./none";
import inboxEmailTemplate from "./inbox";

const emailTemplates = {
  custom: customEmailTemplate,
  line: lineEmailTemplate,
  mjml: mjmlEmailTemplate,
  none: noneEmailTemplate,
  inbox: inboxEmailTemplate,
};

export default emailTemplates;
