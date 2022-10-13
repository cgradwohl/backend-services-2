import { isWarn } from "./handle-error-log";
import { HttpError } from "./http-errors";
import Sentry from "./sentry";

const clientError = /^4\d\d$/;

interface IContext {
  request?: { [key: string]: any };
  user?: Sentry.User;
  ignoreList?: Set<string>;
}

export default async function captureException(
  err: Error,
  context: IContext = {}
): Promise<void> {
  return new Promise<void>((resolve) => {
    // ignore client errors
    if (
      err instanceof HttpError && // only eval. courier http errors
      clientError.test(String((err as any).statusCode))
    ) {
      return resolve();
    }

    // ignore errors categorized as warnings
    if (isWarn(err)) {
      return resolve();
    }

    if (context.ignoreList && context.ignoreList.has(err.name)) {
      return resolve();
    }

    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser(context.user);
      }

      if (context.request) {
        scope.addEventProcessor((event) =>
          Sentry.Handlers.parseRequest(event, context.request)
        );
      }

      Sentry.captureException(err);
      Sentry.flush(2000).then(() => resolve());
    });
  });
}
