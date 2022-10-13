import uuid from "uuid";
import * as preferences from "~/lib/preferences";
import { IChannel, INotificationWire, NotificationCategory } from "~/types.api";
import { IProfilePreferences } from "~/types.public";
describe("channel level preferences", () => {
  const notificationId = "b51c2f3b-6bc9-4822-a743-9b4ffd77bcde";
  const bestOf: IChannel[] = [
    {
      blockIds: ["fa943eb8-895a-4bf6-ade4-c5c143647757"],
      config: {
        email: {
          emailSubject: "Hello World",
          emailTemplateConfig: {
            templateName: "line",
            topBarColor: "#9D3789",
          },
        },
      },
      disabled: false,
      id: "63a6192c-c8bf-49aa-9bbc-39b65cec16a5",
      providers: [
        {
          configurationId: "2a7f2933-b32d-4057-b67f-e891754b9679",
          key: "aws-ses",
        },
        {
          conditional: {
            behavior: "hide",
            filters: [],
            logicalOperator: "and",
          },
          configurationId: "5dc2f8cd-56be-4bf4-b111-564cde04049b",
          key: "sendgrid",
        },
      ],
      taxonomy: "email:*",
    },
    {
      blockIds: ["29547ccb-da3c-4384-98bd-3eab54843fb5"],
      config: {},
      disabled: false,
      id: "67c8a901-fdcc-451a-af0d-7ee44bb86057",
      providers: [
        {
          conditional: {
            behavior: "hide",
            filters: [],
            logicalOperator: "and",
          },
          config: {},
          configurationId: "6e70fed6-39ef-4f5f-9636-5d6cce5c19c7",
          key: "discord",
        },
      ],
      taxonomy: "direct_message:*",
    },
    {
      blockIds: [],
      config: {},
      disabled: false,
      id: "a020b9ee-ebad-43fa-88bf-8f8f3d7e3383",
      providers: [
        {
          config: {
            opsgenie: {
              message: "",
            },
          },
          configurationId: "3afa4e84-9421-42fb-8723-775a4f14ece5",
          key: "opsgenie",
        },
      ],
      taxonomy: "push:*",
    },
  ];

  const notification: Partial<INotificationWire> = {
    id: notificationId,
    json: {
      blocks: [],
      categoryId: undefined,
      channels: {
        always: [],
        bestOf,
      },
      config: {
        type: preferences.NOTIFICATION_TYPES.OPT_IN,
      },
    },
    title: "channel level preferences",
  };
  const categoryId = uuid.v4();
  const category: Partial<NotificationCategory> = {
    id: categoryId,
    json: {
      notificationConfig: {
        type: preferences.NOTIFICATION_TYPES.OPT_IN,
      },
    },
    objtype: "categories",
    tenantId: "lalalala",
    title: "Mock Category",
  };

  const recipientPreferences: IProfilePreferences = {
    notifications: {
      [notificationId]: {
        channel_preferences: [
          {
            channel: "direct_message",
          },
        ],
        status: preferences.PREFERENCE_STATUS.OPTED_IN,
      },
    },
  };

  it("should use category channel preferences over notification", () => {
    const recipientWithCategoryPreferences: IProfilePreferences = {
      categories: {
        [categoryId]: {
          channel_preferences: [
            {
              channel: "email",
            },
          ],
          status: preferences.PREFERENCE_STATUS.OPTED_IN,
        },
      },
      notifications: recipientPreferences.notifications,
    };

    const result = preferences.getChannelPreferences(
      category,
      notification,
      recipientWithCategoryPreferences,
      bestOf
    );
    expect(result).not.toBe(undefined);
    expect(result).toMatchObject([bestOf[0], bestOf[1], bestOf[2]]);
  });

  it("should sort out the channel preferences for notification", () => {
    const result = preferences.getChannelPreferences(
      null,
      notification,
      recipientPreferences,
      bestOf
    );
    expect(result).not.toBe(undefined);
    expect(result).toMatchObject([bestOf[1], bestOf[0], bestOf[2]]);
  });

  it("should return bestOf channels when there are no channel level preferences", () => {
    const result = preferences.getChannelPreferences(
      null,
      notification,
      {
        categories: {
          [categoryId]: {
            status: "OPTED_IN",
          },
        },
        notifications: {
          [notificationId]: {
            status: "OPTED_IN",
          },
        },
      },
      bestOf
    );
    expect(result).not.toBe(undefined);
    expect(result).toMatchObject(bestOf);
  });
});
