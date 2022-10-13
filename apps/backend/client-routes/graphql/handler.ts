import { ApolloServer } from "apollo-server-lambda";
import { APIGatewayProxyHandler } from "aws-lambda";

import ErrorHandlerPlugin from "~/studio/graphql/lib/error-handler";
import context from "./context";
import dataSources from "./data-sources";
import schema from "./schema";

const server = new ApolloServer({
  context,
  dataSources,
  debug: process.env.STAGE === "dev",
  introspection: process.env.STAGE === "dev",
  plugins: [new ErrorHandlerPlugin()],
  schema,
  tracing: process.env.STAGE === "dev",
});

const handler: APIGatewayProxyHandler = (event, ctx, callback) => {
  const cors = {
    origin: "*",
    credentials: true,
  };
  // @ts-ignore: mismatch in library types
  return server.createHandler({ cors })(event, ctx, callback);
};

export default handler;
