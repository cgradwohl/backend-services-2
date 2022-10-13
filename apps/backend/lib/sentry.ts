import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import { StackFrame } from "@sentry/types";

import getServiceTag from "./sentry-service-tag";

const [, functionName] = process.env.AWS_LAMBDA_FUNCTION_NAME.match(
  /^.*-.*-(.*)$/
);

// ensure only created one time
if (!Sentry.getCurrentHub().getClient()) {
  Sentry.init({
    autoSessionTracking: false,
    dsn: "https://7dc936f71b0249a88a6f3c13f7be765c@sentry.io/1825662",
    environment: process.env.SENTRY_ENV,
    integrations: [
      new RewriteFrames({
        iteratee: (frame: StackFrame) => {
          frame.filename = frame.filename.replace(
            /^.+\/webpack:/,
            "webpack:///."
          );

          if (functionName) {
            frame.filename = frame.filename.replace(
              "/var/task",
              `/var/task/${functionName}`
            );
          }

          return frame;
        },
      }),
    ],
    release: process.env.SENTRY_VERSION,
  });

  Sentry.setTags({
    function_name: functionName,
    service_name: getServiceTag(functionName),
  });
}

export default Sentry;
