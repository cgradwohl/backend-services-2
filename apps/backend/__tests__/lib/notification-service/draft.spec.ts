jest.mock("~/lib/courier");
jest.mock("~/lib/segment");
jest.mock("~/auditing/services/emit");

import * as checkService from "~/lib/check-service";
import objectService from "~/lib/dynamo/object-service";
import * as notificationService from "~/lib/notification-service";
import * as notificationDraftService from "~/lib/notification-service/draft";

jest.mock("~/lib/dynamo/object-service", () => {
  const archive = jest.fn();
  const create = jest.fn();
  const get = jest.fn();
  const replace = jest.fn();

  return jest.fn(() => ({
    archive,
    create,
    get,
    replace,
  }));
});

jest.mock("~/lib/notification-service");

jest.mock("~/lib/check-service");

// test values
const tenantId = "testTenantId";
const userId = "testUserId";

describe("DynamoDB Events", () => {
  let mockObjectService: {
    archive: jest.Mock;
    create: jest.Mock;
    get: jest.Mock;
    replace: jest.Mock;
  };
  beforeAll(() => {
    mockObjectService = (objectService as jest.Mock)();
  });
  afterEach(jest.clearAllMocks);

  describe("create", () => {
    it("create a draft will throw error if draftId already exists", async () => {
      const notificationId = "mockNotificationId";
      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {
          draftId: "mockDraftId",
        },
      });
      mockObjectService.create.mockResolvedValue({});

      try {
        await notificationDraftService.create({
          tenantId,
          userId,
          draft: {
            json: {
              blocks: [],
              channels: {
                always: [],
                bestOf: [],
              },
              notificationId,
            },
            title: "mockDraft",
          },
        });
      } catch (ex) {
        expect(
          ex instanceof notificationDraftService.DraftConflict
        ).toBeTruthy();
      }
    });

    it("create a draft and update the notification with the new draftId", async () => {
      const notificationId = "mockNotificationId";
      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {},
      });
      mockObjectService.create.mockResolvedValue({});

      await notificationDraftService.create({
        tenantId,
        userId,
        draft: {
          json: {
            blocks: [],
            channels: {
              always: [],
              bestOf: [],
            },
            notificationId,
          },
          title: "mockDraft",
        },
      });

      expect(mockObjectService.create.mock.calls.length).toEqual(1);
      const createCall = mockObjectService.create.mock.calls[0];
      expect(createCall[1].id.includes(`${notificationId}:`)).toBe(true);
      expect(createCall[1].json.notificationId.includes(notificationId)).toBe(
        true
      );

      const replaceCall = (notificationService.replace as jest.Mock).mock
        .calls[0];
      expect(replaceCall[0].id).toBe(notificationId);
      expect(replaceCall[1].json.draftId.includes(`${notificationId}:`)).toBe(
        true
      );
    });
  });

  describe("publish", () => {
    it("will throw an error if cannot find a draft", async () => {
      const draftId = "mockDraftId";
      const error = await notificationDraftService
        .publish({
          id: draftId,
          tenantId,
          userId,
          payload: {},
        })
        .catch(String);
      expect(error).toBe(`Error: Cannot find Draft: ${draftId}`);
    });

    it("will throw an error if the draft doesn't have a notificationId", async () => {
      const draftId = "mockDraftId";
      mockObjectService.get.mockResolvedValue({
        id: draftId,
        json: {},
      });

      const error = await notificationDraftService
        .publish({
          id: draftId,
          tenantId,
          userId,
          payload: {},
        })
        .catch(String);
      expect(error).toBe(`Error: No Associated Notification Id`);
    });

    it("will throw an error if the publish notification doesn't have a draftId", async () => {
      const draftId = "mockDraftId";
      const notificationId = "mockNotificationId";
      mockObjectService.get.mockResolvedValue({
        id: draftId,
        json: {
          notificationId,
          channels: "mockChannels",
          blocks: "mockBlocks",
        },
      });

      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {},
      });

      try {
        await notificationDraftService.publish({
          id: draftId,
          tenantId,
          userId,
          payload: {
            message: "mockMessage",
          },
        });
      } catch (ex) {
        expect(
          ex instanceof notificationDraftService.DraftConflict
        ).toBeTruthy();
      }
    });

    it("will throw an error if you try to publish the wrong draftId", async () => {
      const draftId = "mockDraftId";
      const notificationId = "mockNotificationId";
      mockObjectService.get.mockResolvedValue({
        id: draftId,
        json: {
          notificationId,
          channels: "mockChannels",
          blocks: "mockBlocks",
        },
      });

      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {
          draftId: "otherDraftId",
        },
      });

      try {
        await notificationDraftService.publish({
          id: draftId,
          tenantId,
          userId,
          payload: {
            message: "mockMessage",
          },
        });
      } catch (ex) {
        expect(
          ex instanceof notificationDraftService.DraftConflict
        ).toBeTruthy();
      }
    });

    it("will publish if the draft has a notificationId", async () => {
      const draftId = "mockDraftId";
      const notificationId = "mockNotificationId";
      mockObjectService.get.mockResolvedValue({
        id: draftId,
        json: {
          notificationId,
          channels: "mockChannels",
          blocks: "mockBlocks",
        },
      });

      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {
          draftId,
        },
      });

      await notificationDraftService.publish({
        id: draftId,
        tenantId,
        userId,
        payload: {
          message: "mockMessage",
        },
      });

      const notificationReplace = (notificationService.replace as jest.Mock)
        .mock.calls[0];
      expect(notificationReplace[0].id).toBe(notificationId);
      expect(notificationReplace[1].json.channels).toBe("mockChannels");
      expect(notificationReplace[1].json.blocks).toBe("mockBlocks");
      expect(notificationReplace[1].json.draftId).toBe(undefined);

      const draftReplace = mockObjectService.replace.mock.calls[0];
      expect(draftReplace[0].id).toBe(draftId);
      expect(draftReplace[1].json.published).toBeTruthy();
    });

    it("will publish if the notification has checks enabled with resolved checks", async () => {
      const draftId = "mockDraftId";
      const notificationId = "mockNotificationId";
      mockObjectService.get.mockResolvedValue({
        id: draftId,
        json: {
          notificationId,
          channels: "mockChannels",
          blocks: "mockBlocks",
          submitted: 1626274393946,
        },
      });

      (checkService.get as jest.Mock).mockResolvedValue({
        json: [
          {
            id: "checkId",
            status: "RESOLVED",
            type: "custom",
            updated: 1626274393946,
          },
        ],
      });

      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {
          draftId,
          checkConfigs: [
            {
              id: "mockCheckConfig",
              enabled: true,
              type: "custom",
            },
          ],
        },
      });

      await notificationDraftService.publish({
        id: draftId,
        tenantId,
        userId,
        payload: {
          message: "mockMessage",
        },
      });

      const notificationReplace = (notificationService.replace as jest.Mock)
        .mock.calls[0];
      expect(notificationReplace[0].id).toBe(notificationId);
      expect(notificationReplace[1].json.channels).toBe("mockChannels");
      expect(notificationReplace[1].json.blocks).toBe("mockBlocks");
      expect(notificationReplace[1].json.draftId).toBe(undefined);

      const draftReplace = mockObjectService.replace.mock.calls[0];
      expect(draftReplace[0].id).toBe(draftId);
      expect(draftReplace[1].json.published).toBeTruthy();
    });

    it("will not publish but submit if the notification has checks enabled and it was a first-time submit or a resubmit", async () => {
      const draftId = "mockDraftId";
      const notificationId = "mockNotificationId";
      mockObjectService.get.mockResolvedValue({
        id: draftId,
        json: {
          notificationId,
          channels: "mockChannels",
          blocks: "mockBlocks",
        },
      });

      (notificationService.get as jest.Mock).mockResolvedValue({
        id: notificationId,
        json: {
          draftId,
          checkConfigs: [
            {
              id: "mockCheckConfig",
              enabled: true,
              type: "custom",
            },
          ],
        },
      });

      await notificationDraftService.publish({
        id: draftId,
        tenantId,
        userId,
        payload: {
          message: "mockMessage",
        },
      });

      const draftReplace = mockObjectService.replace.mock.calls[0];

      const submitted = draftReplace[1].json.submitted;

      expect(draftReplace[0].id).toBe(draftId);
      expect(submitted).toBeTruthy();

      const checksCreateMock = (checkService.create as jest.Mock).mock.calls[0];

      expect(checksCreateMock[1].id).toBe(`${notificationId}:${submitted}`);
      // this will probably change as we add more types
      expect(checksCreateMock[1].json.length).toBe(1);
      expect(checksCreateMock[1].json[0].status).toBe("PENDING");
      expect(checksCreateMock[1].json[0].type).toBe("custom");
    });
  });
});
