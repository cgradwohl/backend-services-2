import axios, { Method } from "axios";

export interface IHeaders {
  [header: string]: string;
}

const forwardWebhook = async (
  method: Method,
  webhookUrl: string,
  data: any,
  headers: IHeaders
): Promise<{
  body: string;
  headers: IHeaders;
  status: number;
}> => {
  // forward webhook
  const webhookResponse = await axios(webhookUrl, {
    data,
    headers,
    method,
    responseType: "text",

    // don't throw
    validateStatus: () => true,
  });

  return {
    body: webhookResponse.data,
    headers: webhookResponse.headers,
    status: webhookResponse.status,
  };
};

export default forwardWebhook;
