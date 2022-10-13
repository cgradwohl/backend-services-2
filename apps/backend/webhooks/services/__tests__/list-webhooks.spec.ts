import * as dynamoObjectService from "~/lib/dynamo/object-service";
import { InternalCourierError } from "~/lib/errors";
import { listWebhooks } from "../list-webhooks";
describe("listWebhooks", () => {
  it("should pass", async () => {
    const spy = jest
      .spyOn(dynamoObjectService, "default")
      .mockImplementation((() => {
        return {
          list: async () => {
            throw new Error("oops");
          },
        };
      }) as unknown as typeof dynamoObjectService.default);

    await expect(listWebhooks("mock")).rejects.toThrowError();
    await expect(listWebhooks("mock")).rejects.toThrow(InternalCourierError);

    spy.mockRestore();
  });
});
