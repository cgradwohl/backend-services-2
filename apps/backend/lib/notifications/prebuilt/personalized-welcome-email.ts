import uuid from "uuid";
import { CourierObject, INotificationJsonWire } from "~/types.api";

const notificationJsonWire: Omit<
  CourierObject<INotificationJsonWire>,
  "tenantId" | "created" | "creator"
> = {
  id: "personalized-welcome-email",
  json: {
    blocks: [
      {
        config:
          '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Welcome to Courier!","marks":[]}]}]}},"textStyle":"h1"}',
        id: "b1cd6b0e-ead0-4f34-991e-83ae09fd504d",
        type: "text",
      },
      {
        config:
          '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"We’re so excited to work with you. For more documentation on how to start building and sending your first notifications, see our ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://docs.courier.com/docs","text":"documentation","disableLinkTracking":false},"nodes":[{"object":"text","text":"documentation","marks":[{"object":"mark","type":"textColor","data":{"color":"{brand.colors.tertiary}","brandColors":{"primary":"#9121C2","secondary":"#ED4362","tertiary":"#24AF9C"}}}]}]},{"object":"text","text":" on how to get started.","marks":[]}]}]}}}',
        id: "946565c8-0d96-4cc8-ad96-90730367cf85",
        type: "text",
      },
      {
        config:
          '{"align":"left","backgroundColor":"{brand.colors.primary}","href":"https://help.courier.com/en/articles/4170038-day-1-with-courier","style":"button","text":"Day 1 Guide"}',
        id: "21dd4527-9cb8-4e55-aa3d-157130705c80",
        type: "action",
      },
      {
        config:
          '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Cheers,\\n","marks":[]},{"object":"text","text":"The Courier Team","marks":[{"object":"mark","type":"bold","data":{}}]}]}]}}}',
        id: "a9254e15-e73a-4f33-bdd5-710194581319",
        type: "text",
      },
    ],
    channels: {
      always: [],
      bestOf: [
        {
          blockIds: [
            "b1cd6b0e-ead0-4f34-991e-83ae09fd504d",
            "946565c8-0d96-4cc8-ad96-90730367cf85",
            "21dd4527-9cb8-4e55-aa3d-157130705c80",
            "a9254e15-e73a-4f33-bdd5-710194581319",
          ],
          config: {
            email: {
              emailSubject: "Hi, {firstname} 👋",
              emailTemplateConfig: {
                templateName: "line",
                topBarColor: "#9D3789",
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
  },
  objtype: "event",
  title: "Personalized Welcome Email",
};

export default notificationJsonWire;
