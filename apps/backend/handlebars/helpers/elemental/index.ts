import actionBlockHandlebarsHelper from "./action-block";
import textBlockHandlebarsHelper from "./text-block";
import markdownMarkHandlebarsHelper from "../markdown/markdown-mark";

const helpers = {
  "elemental-action-block": actionBlockHandlebarsHelper,
  "elemental-text-block": textBlockHandlebarsHelper,
  "markdown-mark": markdownMarkHandlebarsHelper,
};

export default helpers;
