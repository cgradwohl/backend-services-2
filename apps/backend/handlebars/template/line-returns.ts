import { TemplateHandlerType } from "./types";

const lineReturns: { [key in TemplateHandlerType]: string } = {
  discord: "\n",
  email: "<br>",
  inApp: "\n",
  elemental: "\n",
  markdown: "\n",
  msteams: "\n\n",
  plain: "\n",
  slack: "\n",
  webhook: "\n",
  text: " ", // all text is currently single-line. May need to change later
};

export default lineReturns;
