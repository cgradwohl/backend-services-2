import { ApolloServer } from "apollo-server-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

import getorigin from "~/lib/get-cors-origin";
import context from "./context";
import dataSources from "./data-sources";
import ErrorHandler from "./lib/error-handler";
import schema from "./schema";

const server = new ApolloServer({
  context,
  dataSources,
  debug: process.env.STAGE === "dev",
  introspection: process.env.STAGE === "dev",
  playground: {
    // ensures that the playground only works in developemnt
    // consider adding an affordance for staging
    endpoint: "/dev/studio/q",
  },
  plugins: [new ErrorHandler()],
  schema,
  tracing: process.env.STAGE === "dev",
});

const getCors = (event: APIGatewayProxyEvent) => {
  const origin = getorigin();

  if (typeof origin === "function") {
    return {
      origin: origin({
        headers: {
          origin: event.headers?.origin,
        },
      }),
    };
  }

  return { origin };
};

const handler: APIGatewayProxyHandler = (event, ctx, callback) => {
  const cors = getCors(event);
  // @ts-ignore: mismatch in library types
  return server.createHandler({ cors })(event, ctx, callback);
};

export default handler;
