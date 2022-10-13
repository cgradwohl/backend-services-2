import { list as listNotifications } from "~/lib/notification-service";
import { transformRequest as transformCursorRequest } from "~/api/transforms/cursor";
import { transformResponse } from "./transforms/list";
import { ListFn } from "../types";

const list: ListFn = async (context) => {
  const { event, tenantId } = context;
  const cursor = event.queryStringParameters
    ? event.queryStringParameters.cursor
    : null;
  const exclusiveStartKey = transformCursorRequest(cursor);

  const response = await listNotifications({
    tenantId,
    exclusiveStartKey,
  });

  const body = transformResponse(response);
  return { body };
};

export default list;
