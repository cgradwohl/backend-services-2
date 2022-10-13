import { InternalCourierError } from "~/lib/errors";
import * as UpdateLogModule from "~/webhooks/services/update-log";
import { IWebhookLog } from "~/webhooks/types";
const updateLog = UpdateLogModule.updateLog;

describe("updateLog", () => {
  it("should throw an InternalCourierError", async () => {
    const service = {
      update: async (log: IWebhookLog, discriminator: string) => {
        throw new Error("oops");
      },
    };

    await expect(
      updateLog(service, {} as IWebhookLog, "mock")
    ).rejects.toThrowError();

    await expect(updateLog(service, {} as IWebhookLog, "mock")).rejects.toThrow(
      InternalCourierError
    );
  });
});
