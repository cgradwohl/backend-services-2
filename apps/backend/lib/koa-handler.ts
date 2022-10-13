import serverlessHttp from "serverless-http";

export const koaHandler = app =>
  serverlessHttp(app, {
    request(request, event) {
      request.event = event;
    },
  });
