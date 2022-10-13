import { transformRequest } from "~/api/notifications/locales/transforms/channel/put";

describe("put channel locales", () => {
  it("will update email subject", () => {
    const templateLocales = transformRequest(
      {
        id: "123",
        tenantId: "mockTenantId",
        created: 123,
        creator: "riley",
        objtype: "notification-draft",
        title: "My Template",
        json: {
          channels: {
            bestOf: [
              {
                blockIds: ["acb8ffe8-7732-42df-b7bb-9905e216e81d"],

                config: {
                  email: {
                    emailSubject: "English Subject",

                    emailTemplateConfig: {
                      templateName: "line",

                      topBarColor: "#9D3789",
                    },
                  },

                  locales: {},
                },

                id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",

                providers: [
                  {
                    configurationId: "eaf38bb9-9121-4b39-ad64-119371e2cc5d",

                    key: "sendgrid",
                  },
                ],

                taxonomy: "email:*",

                disabled: false,

                label: "",
              },
            ],
            always: [],
          },
          blocks: [
            {
              config:
                '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Hello World","marks":[]}]}]}},"locales":{}}',
              id: "acb8ffe8-7732-42df-b7bb-9905e216e81d",
              type: "text",
            },
          ],
        },
      },
      "channel_a4f9187f-4627-48c2-b822-3e320feb4c5b",
      {},
      {
        fr_FR: "French Subject",
      }
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [],
        channels: [
          {
            content: { subject: "French Subject" },
            id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
          },
        ],
      },
    });
  });

  it("will update push title", () => {
    const templateLocales = transformRequest(
      {
        id: "123",
        tenantId: "mockTenantId",
        created: 123,
        creator: "riley",
        objtype: "notification-draft",
        title: "My Template",
        json: {
          channels: {
            bestOf: [
              {
                blockIds: ["69b3de12-f41d-4194-a432-aa62df9a3a40"],

                config: {
                  push: {
                    clickAction: "click",
                    icon: "icon",
                    title: "English Title",
                  },

                  locales: {},
                },

                id: "26de7ee6-5e2c-4203-841b-99bb871a27f0",

                providers: [
                  {
                    configurationId: "1bccb631-9bc5-48dc-be54-76e74b8d4df5",

                    key: "pusher",
                  },
                ],

                taxonomy: "push:*",

                disabled: false,

                label: "",
              },
            ],
            always: [],
          },
          blocks: [
            {
              config:
                '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Hello World","marks":[]}]}]}},"locales":{}}',

              id: "69b3de12-f41d-4194-a432-aa62df9a3a40",

              type: "text",
            },
          ],
        },
      },
      "channel_26de7ee6-5e2c-4203-841b-99bb871a27f0",
      {},
      {
        fr_FR: "French Title",
      }
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [],
        channels: [
          {
            content: { title: "French Title" },
            id: "26de7ee6-5e2c-4203-841b-99bb871a27f0",
          },
        ],
      },
    });
  });
});
