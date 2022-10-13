import axios from "axios";
import { JSONObject } from "~/types.api";
import { IApiDataSourceConfig, IApiWebhookResponse } from "~/types.public";
import { mergeByStrategy } from "../merge-by-strategy";

export const getEventDataByRecipient = async (
  recipientId: string,
  eventData: JSONObject,
  source?: IApiDataSourceConfig
) => {
  if (!source || !source.webhook) {
    return eventData;
  }

  const { merge_strategy: strategy } = source;
  const { body: webhookBody, headers, params, method, url } = source.webhook;

  const response = await axios({
    data: webhookBody,
    headers,
    method: method ?? "GET",
    params: {
      ...params,
      recipientId,
    },
    url,
  });

  const mergedData = mergeByStrategy(
    strategy,
    eventData, // target
    response?.data ?? {} // source
  );

  return mergedData;
};
