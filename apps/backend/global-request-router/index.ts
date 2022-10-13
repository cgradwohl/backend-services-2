import { Handler, CloudFrontRequestEvent, CloudFrontRequest } from "aws-lambda";

export const handler: Handler<CloudFrontRequestEvent, CloudFrontRequest> =
  async (event): Promise<CloudFrontRequest> => {
    const [incomingRecord] = event.Records;
    const request = incomingRecord.cf.request;
    return request;
  };
