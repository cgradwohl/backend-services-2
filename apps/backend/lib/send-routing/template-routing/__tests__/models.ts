import { IProviderConfiguration } from "~/send/types";
import { INotificationWire } from "~/types.api";
import { IProfilePreferences } from "~/types.public";

export const providers: IProviderConfiguration[] = [
  {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639605905726,
    archived: false,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639605905726,
    json: {
      publicKey: "",
      privateKey: "",
      fromEmail: "support@trycourier.com",
      fromName: "Courier Support",
      provider: "mailjet",
    },
    objtype: "configuration",
    id: "b46abb6b-e99e-473b-927a-7d9843ec0442",
    title: "Default Configuration",
  },
  {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639605905726,
    archived: false,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639605905726,
    json: {
      publicKey: "",
      privateKey: "",
      fromEmail: "support@trycourier.com",
      fromName: "Courier Support",
      provider: "sendgrid",
    },
    objtype: "configuration",
    id: "sendgrid",
    title: "Default Configuration",
  },
  {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639019685241,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639019685241,
    json: {
      provider: "courier",
      clientKey: "",
      domains: "",
      hmacEnabled: false,
      hmacDocs: "",
    },
    objtype: "configuration",
    id: "bfcb2dc6-6774-4642-af70-920674639f3f",
    title: "Default Configuration",
  },
  {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639019685241,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639019685241,
    json: {
      provider: "apn",
      clientKey: "",
      domains: "",
      hmacEnabled: false,
      hmacDocs: "",
    },
    objtype: "configuration",
    id: "apn",
    title: "Default Configuration",
  },
  {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639019685241,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639019685241,
    json: {
      provider: "twilio",
    },
    objtype: "configuration",
    id: "twilio",
    title: "Default Configuration",
  },
  {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639019685241,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639019685241,
    json: {
      provider: "firebase-fcm",
      clientKey: "",
      domains: "",
      hmacEnabled: false,
      hmacDocs: "",
    },
    objtype: "configuration",
    id: "firebase",
    title: "Default Configuration",
  },
];

export const simpleNotification: INotificationWire = {
  updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
  updated: 1646424300439,
  archived: false,
  creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
  tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
  created: 1646424300439,
  json: {
    blocks: [],
    brandConfig: {
      enabled: true,
    },
    channels: {
      always: [
        {
          blockIds: [],
          config: {
            locales: {},
          },
          id: "db52df90-94fa-475e-90d0-6f2d64076502",
          providers: [
            {
              key: "courier",
              configurationId: "bfcb2dc6-6774-4642-af70-920674639f3f",
              config: {},
            },
          ],
          taxonomy: "push:web:courier",
          disabled: false,
          label: "",
        },
        {
          id: "9acdc029-4d16-4dd4-a46a-a7c50d256018",
          blockIds: [],
          taxonomy: "direct_message:slack",
          providers: [
            {
              key: "slack",
              configurationId: "5e82280f-d031-40db-813f-3c4a75ad14f8",
              config: {},
            },
          ],
          config: {
            locales: {},
          },
        },
      ],
      bestOf: [
        {
          blockIds: ["92e08808-8883-4034-be2f-d372df5db3c1"],
          config: {
            email: {
              emailSubject: "New Subject",
              emailTemplateConfig: {
                templateName: "line",
                topBarColor: "#9121C2",
              },
            },
            locales: {},
          },
          id: "6721af5a-7d56-4906-a021-6f30fe84253a",
          providers: [
            {
              key: "mailjet",
              configurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
              config: {},
            },
          ],
          taxonomy: "email:*",
          disabled: false,
          label: "",
        },
      ],
    },
    config: {
      type: "OPT_OUT",
    },
  },
  objtype: "event",
  id: "6e7b21eb-b352-4b53-ac0f-be7b18ba6e6f",
  title: "SMS Preferences Test",
};

export const pushNotification: INotificationWire = {
  updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
  updated: 1646424300439,
  archived: false,
  creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
  tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
  created: 1646424300439,
  json: {
    blocks: [],
    brandConfig: {
      enabled: true,
    },
    channels: {
      always: [
        {
          blockIds: [],
          config: {
            locales: {},
          },
          id: "db52df90-94fa-475e-90d0-6f2d64076502",
          providers: [
            {
              key: "apn",
              configurationId: "apn",
              config: {},
            },
          ],
          taxonomy: "push:*",
          disabled: false,
          label: "",
        },
      ],
      bestOf: [
        {
          blockIds: ["92e08808-8883-4034-be2f-d372df5db3c1"],
          config: {
            locales: {},
          },
          id: "6721af5a-7d56-4906-a021-6f30fe84253a",
          providers: [
            {
              key: "firebase-fcm",
              configurationId: "firebase",
              config: {},
            },
          ],
          taxonomy: "push:*",
          disabled: false,
          label: "",
        },
      ],
    },
    config: {
      type: "OPT_OUT",
    },
  },
  objtype: "event",
  id: "6e7b21eb-b352-4b53-ac0f-be7b18ba6e6f",
  title: "Push Test",
};

export const profile = {
  user_id: "0460766e-8463-4905-ae98-b72c7aef41d6",
  email: "meh@bloop.com",
  phone_number: "2086021896",
  courier: {
    channel: "gr7EABWD761vbWsda2JNTZ",
  },
};

export const preferences: IProfilePreferences = {
  categories: {},
  notifications: {
    DSXJ3TTPD94PMRNG7VWYY32X6WVY: {
      channel_preferences: [
        {
          channel: "email",
        },
      ],
      rules: [],
      status: "OPTED_IN",
    },
  },
};

export const complexFailoverNotification: INotificationWire = {
  updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
  updated: 1657755804846,
  archived: false,
  creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
  tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
  created: 1657755804846,
  json: {
    blocks: [],
    channels: {
      always: [
        {
          blockIds: [],
          config: {
            locales: {},
          },
          id: "8b41124e-60cd-4092-8b73-858d4607d85f",
          providers: [
            {
              configurationId: "firebase",
              key: "firebase-fcm",
              conditional: {
                filters: [],
                logicalOperator: "and",
                behavior: "hide",
              },
            },
          ],
          taxonomy: "push:*",
          disabled: false,
          label: "",
        },
      ],
      bestOf: [
        {
          blockIds: [],
          config: {
            locales: {},
          },
          id: "87616a84-d4dd-4d44-afd9-bd62dda8ac4b",
          providers: [
            {
              key: "twilio",
              configurationId: "twilio",
              config: {},
            },
          ],
          taxonomy: "direct_message:sms:*",
        },
        {
          blockIds: [],
          config: {
            email: {
              emailSubject: "New Subject",
              emailTemplateConfig: {
                templateName: "line",
                topBarColor: "#9121C2",
              },
            },
            locales: {},
          },
          id: "f9a8c713-792f-4396-80e9-69c48f9f1d2d",
          providers: [
            {
              configurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
              key: "mailjet",
            },
            {
              configurationId: "sendgrid",
              key: "sendgrid",
            },
          ],
          taxonomy: "email:*",
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
  id: "47a3f447-3afc-40d9-bf9f-05f903688891",
  title: "Untitled Notification 4",
};
