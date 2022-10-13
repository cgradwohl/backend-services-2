import emailHandlebarsHelpers from "./email";
import elementalHandlebarsHelpers from "./elemental";
import inAppHandlebarsHelpers from "./in-app";
import markdownHandlebarsHelpers from "./markdown";
import msteamsHelpers from "./msteams";
import slackHandlebarsHelpers from "./slack";
import universalHandlebarsHelpers from "./universal";
import webhookHandlebarsHelpers from "./webhook";

const courierHandlebarsHelpers = {
  email: emailHandlebarsHelpers,
  elemental: elementalHandlebarsHelpers,
  inApp: inAppHandlebarsHelpers,
  markdown: markdownHandlebarsHelpers,
  msteams: msteamsHelpers,
  plain: {},
  slack: slackHandlebarsHelpers,
  universal: universalHandlebarsHelpers,
  webhook: webhookHandlebarsHelpers,
};

export default courierHandlebarsHelpers;
