import uuid from "uuid";
import { CourierObject, INotificationJsonWire } from "~/types.api";

const notificationJsonWire: Omit<
  CourierObject<INotificationJsonWire>,
  "tenantId" | "created" | "creator"
> = {
  id: "courier-quickstart",
  json: {
    blocks: [
      {
        config:
          '{"value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Heyo! This is an email you sent using the Courier API.","marks":[]}]}]}}}',
        id: "ac76be0c-e122-416f-b5f0-e5770b8e4610",
        type: "text",
      },
    ],
    channels: {
      always: [],
      bestOf: [
        {
          blockIds: ["ac76be0c-e122-416f-b5f0-e5770b8e4610"],
          conditional: {
            filters: [],
            logicalOperator: "and",
          },
          config: {
            email: {
              emailSubject: "Your Courier test send - {favoriteAdjective}!",
              emailTemplateConfig: {
                templateName: "line",
                topBarColor: "#9121C2",
              },
            },
          },
          disabled: false,
          id: uuid.v4(),
          providers: [],
          taxonomy: "email:*",
        },
      ],
    },
    tagIds: ["UNTAGGED"],
    testEvents: [
      {
        data: {
          favoriteAdjective: "awesomeness",
        },
        id: "fb2c3228-d3d7-4ce8-81d9-5472ae0e0111",
        label: "Your test send",
        profile: {},
      },
    ],
  },
  objtype: "event",
  title: "Your Courier test send",
};

export default notificationJsonWire;
