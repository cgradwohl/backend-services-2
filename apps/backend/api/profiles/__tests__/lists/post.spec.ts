import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";
import { postProfileLists } from "~/api/profiles/lists/post";
import * as subscriptionStore from "~/lib/lists";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/lists");

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = subscriptionStore as any;

describe("when adding profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return a new profile given an existing profile", async () => {
    dynamo.subscribe.mockResolvedValue("");
    const subscriptionSpy = jest.spyOn(subscriptionStore, "subscribe");

    const newLists = {
      lists: [
        {
          listId: "example.list",
          preferences: {
            notifications: {
              W951R8G37V49KZMK8DEKW8Z588BZ: {
                channel_preferences: { channel: "direct_message" },
                status: "OPTED_IN",
              },
            },
          },
        },
      ],
    };
    await expect(
      postProfileLists({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: JSON.stringify(newLists) },
        userId: "id",
      })
    ).resolves.toEqual({ status: "SUCCESS" });
    const [firstSubscriptionCall] = subscriptionSpy.mock.calls;

    expect(subscriptionSpy.mock.calls.length).toBe(1);
    expect(firstSubscriptionCall).toEqual([
      "a-tenantId",
      "id",
      "example.list",
      "id",
      {
        notifications: {
          W951R8G37V49KZMK8DEKW8Z588BZ: {
            channel_preferences: { channel: "direct_message" },
            status: "OPTED_IN",
          },
        },
      },
    ]);
  });
});
