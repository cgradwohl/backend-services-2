import { getUserContext } from "../lambda-response";

export default async (context, next) => {
  context.userContext = getUserContext(context.req.event);
  await next();
};
