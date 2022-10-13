import { ApolloError } from "apollo-server-lambda";
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from "apollo-server-plugin-base";
import captureException from "~/lib/capture-exception";

export default class ErrorHandlerPlugin implements ApolloServerPlugin {
  public requestDidStart(): GraphQLRequestListener {
    return {
      async didEncounterErrors(ctx: GraphQLRequestContext): Promise<void> {
        if (!ctx.operation) {
          return;
        }

        for (const err of ctx.errors) {
          if (
            err instanceof ApolloError &&
            // assume it is a client error otherwise
            err.extensions?.code !== "INTERNAL_SERVER_ERROR"
          ) {
            continue;
          }

          await captureException(err);
        }
      },

      willSendResponse({ errors, response }) {
        if (process.env.STAGE !== "dev" && response && response.http) {
          if (
            errors &&
            errors.some((err) => err.message.includes("Did you mean"))
          ) {
            // customized to avoid information disclosure
            response.errors = [
              {
                message: "GraphQL validation failed",
              },
            ];
          }
        }
      },
    };
  }
}
