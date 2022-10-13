import { search } from "~/auditing/services/search";
import { esResponseMapperApi } from "~/auditing/services/search";
import { getQueryParam } from "~/lib/lambda-response";
import { IApiAuditEventsListResponse, ListFn } from "./types";

const convertStringToBase64 = (value: string) => {
  const buff = Buffer.from(value, "utf8");
  return buff.toString("base64");
};

const convertBase64ToString = (value: string) => {
  const buff = Buffer.from(value, "base64");
  return buff.toString("utf8");
};

const list: ListFn = async (context) => {
  const { tenantId } = context;
  const cursor = getQueryParam(context, "cursor");

  const { items, next } = await search(
    tenantId,
    {
      at: undefined,
      limit: 10,
      next: cursor ? convertBase64ToString(cursor) : undefined,
      prev: undefined,
      search: {},
      start: undefined,
    },
    esResponseMapperApi
  );

  const response: IApiAuditEventsListResponse = {
    paging: {
      cursor: next ? convertStringToBase64(next) : undefined,
      more: next ? true : false,
    },
    results: items,
  };

  return { body: response };
};

export default list;
