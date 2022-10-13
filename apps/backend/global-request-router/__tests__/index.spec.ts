import { CloudFrontRequestEvent } from "aws-lambda";
import { handler } from "~/global-request-router";
import * as fixtureEvent from "./fixtures/cloudfront-event.json";

describe("origin-request handler", () => {
  it("should return a CloudFrontRequest", async () => {
    const event: CloudFrontRequestEvent =
      fixtureEvent as unknown as CloudFrontRequestEvent;
    const request = await handler(event, null, null);
    expect(request).toMatchObject(event.Records[0].cf.request);
  });
});
