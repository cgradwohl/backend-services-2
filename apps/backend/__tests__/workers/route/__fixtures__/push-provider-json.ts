import uuid from "uuid";

const channelId = uuid.v4();
const blockId = uuid.v4();
const taxonomy = "push:web:courier";
const configurationId = uuid.v4();
const messageId = uuid.v4();
const tenantId = uuid.v4();
const notificationId = uuid.v4();
const templateId = uuid.v4();

export const trackingId = uuid.v4();
export const recipientId = uuid.v4();
export const channel = {
  id: channelId,
  blockIds: [blockId],
  taxonomy: taxonomy,
  providers: [
    {
      key: "courier",
      configurationId: configurationId,
      config: {},
      conditional: {
        filters: [],
        logicalOperator: "and",
        behavior: "hide",
      },
    },
  ],
  config: {
    push: {
      title: "Title!!",
    },
  },
  disabled: false,
  label: "",
};

export const message = {
  messageId: messageId,
  messageLocation: {
    path: `${tenantId}/${messageId}.json`,
    type: "S3",
  },
  tenantId: tenantId,
  type: "route",
};

export const notification = {
  updater: recipientId,
  updated: 1616433798651,
  archived: false,
  creator: recipientId,
  tenantId: tenantId,
  created: 1614043983341,
  json: {
    blocks: [
      {
        config:
          '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Lorem ipsum!","marks":[]}]}]}}}',
        id: blockId,
        type: "text",
      },
    ],
    channels: {
      always: [],
      bestOf: [
        {
          id: channelId,
          blockIds: [blockId],
          taxonomy: taxonomy,
          providers: [
            {
              key: "courier",
              configurationId: configurationId,
              config: {},
              conditional: {
                filters: [],
                logicalOperator: "and",
                behavior: "hide",
              },
            },
          ],
          config: {
            push: {
              title: "Title!!",
            },
          },
          disabled: false,
          label: "",
        },
      ],
    },
    brandConfig: {
      enabled: true,
    },
  },
  objtype: "event",
  id: notificationId,
  title: "Untitled Notification",
};

export const providerConfig = {
  updater: recipientId,
  updated: 1614043487384,
  archived: false,
  creator: recipientId,
  tenantId: tenantId,
  created: 1614043477972,
  json: {
    provider: "courier",
  },
  objtype: "configuration",
  id: configurationId,
  title: "Default Configuration",
};

export const clickThroughTrackingEnabled = false;
export const links = {};
export const variableData = {
  brand: {
    email: {
      header: {
        barColor: "#9D3789",
      },
    },
    colors: {},
    id: "S0E8PFMXC44SSFG6J8A7EF4QXRNX",
  },
  data: {
    templateId: templateId,
    templateName: "Untitled Notification",
  },
  event: "TEMPLATE_PUBLISHED",
  messageId: messageId,
  profile: {
    courier: {
      channel: recipientId,
    },
  },
  recipient: recipientId,
  urls: {
    opened: `https://a4imqw2244.execute-api.us-east-1.amazonaws.com/dev/o/${tenantId}.gg20cw3bywmcb2qeqywh3bgf8xmg.gif`,
    unsubscribe: `https://a4imqw2244.execute-api.us-east-1.amazonaws.com/dev/u/${tenantId}.5c739d7e-fe8a-48d8-bdc1-2ebc1ced386b`,
  },
};
export const emailOpenTrackingEnabled = true;
export const openTrackingId = uuid.v4();
export const unsubscribeTrackingId = uuid.v4();
