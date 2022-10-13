import discordHandlebarsPartials from "./discord";
import emailHandlebarsPartials from "./email";
import elementalHandlebarsPartials from "./elemental";
import inAppHandlebarsPartials from "./in-app";
import launchdarklyEmailHandlerbarsPartials from "./customers/launchdarkly";
import markdownHandlebarsPartials from "./markdown";
import msteamsHandlebarsPartials from "./msteams";
import plainHandlebarsPartials from "./plain";
import slackHandlebarsPartials from "./slack";
import webhookHandlebarsPartials from "./webhook";

const courierHandlebarsPartials = {
  discord: discordHandlebarsPartials,
  email: emailHandlebarsPartials,
  elemental: elementalHandlebarsPartials,
  inApp: inAppHandlebarsPartials,
  markdown: markdownHandlebarsPartials,
  msteams: msteamsHandlebarsPartials,
  plain: plainHandlebarsPartials,
  slack: slackHandlebarsPartials,
  tenants: {
    launchdarkly: launchdarklyEmailHandlerbarsPartials,
  },
  webhook: webhookHandlebarsPartials,
};

export default courierHandlebarsPartials;
