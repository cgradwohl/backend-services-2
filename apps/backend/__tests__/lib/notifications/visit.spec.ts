import visit from "~/lib/notifications/visit";
import { NOTIFICATION } from "./__fixtures__/notification";

describe("when visiting", () => {
  it("will walk channels if an apply function is there", () => {
    const apply = {
      channels: jest.fn(),
    };

    visit(NOTIFICATION, apply, { tenantId: NOTIFICATION.tenantId });

    expect(apply.channels.mock.calls.length).toBe(2);
    expect(apply.channels.mock.calls[0][0]).toBe(
      NOTIFICATION.json.channels.always
    );
    expect(apply.channels.mock.calls[0][1]).toStrictEqual({
      tenantId: NOTIFICATION.tenantId,
    });
    expect(apply.channels.mock.calls[1][0]).toBe(
      NOTIFICATION.json.channels.bestOf
    );
    expect(apply.channels.mock.calls[1][1]).toStrictEqual({
      tenantId: NOTIFICATION.tenantId,
    });
  });
});
