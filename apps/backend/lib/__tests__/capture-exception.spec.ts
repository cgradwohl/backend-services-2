import { NotificationNotFoundError } from "~/send/worker/commands/prepare/errors";
import captureException from "../capture-exception";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry", () => ({
  withScope: (cb: () => void) => cb(),
  flush: () => Promise.resolve(),
  captureException: () => captureExceptionMock(),
}));

const captureExceptionMock = jest.fn();

describe("capture exception", () => {
  afterEach(jest.clearAllMocks);

  it("captures a regular error", async () => {
    expect.assertions(1);
    await captureException(new Error());
    expect(captureExceptionMock).toHaveBeenCalled();
  });

  it("ignores errors listed in ignore list", async () => {
    expect.assertions(1);
    await captureException(new NotificationNotFoundError(), {
      ignoreList: new Set(["NotificationNotFoundError"]),
    });
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });
});
