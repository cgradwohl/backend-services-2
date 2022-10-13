import actionBlockHandlebarsHelper from "./action-block";
import textBlockHandlebarsHelper from "./text-block";
import markdownMarkHandlebarsHelper from "../markdown/markdown-mark";

const helpers = {
  "in-app-action-block": actionBlockHandlebarsHelper,
  "in-app-text-block": textBlockHandlebarsHelper,
  "markdown-mark": markdownMarkHandlebarsHelper,
};

export default helpers;
