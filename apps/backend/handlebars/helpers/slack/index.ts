import getActionIdHandlebarsHelper from "./get-action-id";
import jsonnetHandlebarsHelper from "../shared/jsonnet";
import markdownQuoteHandlebarsHelper from "../markdown/markdown-quote";
import markdownMarkHandlebarsHelper from "../markdown/markdown-mark";
import slackActionBlockHandlebarsHelper from "./slack-action-block";
import slackDividerBlockHandlebarsHelper from "./slack-divider-block";
import slackImageBlockHandlebarsHelper from "./slack-image-block";
import slackMarkdownHandlebarsHelper from "./markdown";
import slackTextBlockHandlebarsHelper from "./slack-text-block";

const slackHandlebarsHelpers = {
  "get-action-id": getActionIdHandlebarsHelper,
  "markdown-mark": markdownMarkHandlebarsHelper,
  "markdown-quote": markdownQuoteHandlebarsHelper,
  "slack-action-block": slackActionBlockHandlebarsHelper,
  "slack-divider-block": slackDividerBlockHandlebarsHelper,
  "slack-image-block": slackImageBlockHandlebarsHelper,
  "slack-text-block": slackTextBlockHandlebarsHelper,
  jsonnet: jsonnetHandlebarsHelper,
  markdown: slackMarkdownHandlebarsHelper,
};

export default slackHandlebarsHelpers;
