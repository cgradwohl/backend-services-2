import { S3Event } from "aws-lambda";
import handler from "../handler";

const createMockEvent = (event?: Partial<S3Event>): S3Event => ({
  Records: [],
  ...(event ?? {}),
});

it("should do nothing", async () => {
  const results = await handler(createMockEvent(), undefined, undefined);
  expect(results).toBeUndefined();
});
