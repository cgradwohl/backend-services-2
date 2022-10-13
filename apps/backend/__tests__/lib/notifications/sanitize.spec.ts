import { list as listSpy } from "~/lib/configurations-service";
import extractConfigurations from "~/lib/notifications/extract-configurations";
import sanitize from "~/lib/notifications/sanitize";
import { NOTIFICATION_WITH_ARCHIVED_CONFIGURATIONS } from "./__fixtures__/notification";

jest.mock("~/lib/configurations-service", () => {
  return {
    list: jest.fn(),
  };
});

describe("when sanitizing", () => {
  it("will remove archived configurations", async () => {
    const listMock = listSpy as jest.Mock;
    listMock.mockResolvedValue({ objects: [{ id: "41" }] });
    expect(
      extractConfigurations(NOTIFICATION_WITH_ARCHIVED_CONFIGURATIONS).length
    ).toBe(1);

    const { tenantId } = NOTIFICATION_WITH_ARCHIVED_CONFIGURATIONS;
    const result = await sanitize(
      NOTIFICATION_WITH_ARCHIVED_CONFIGURATIONS,
      tenantId
    );

    expect(
      extractConfigurations(NOTIFICATION_WITH_ARCHIVED_CONFIGURATIONS).length
    ).toBe(1);
    expect(extractConfigurations(result).length).toBe(0);

    expect(listMock.mock.calls.length).toBe(1);
    expect(listMock.mock.calls[0][0]).toStrictEqual({
      archived: true,
      tenantId,
    });
  });
});
