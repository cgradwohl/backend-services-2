import { INotificationWire } from "~/types.api";

export const NOTIFICATION: INotificationWire = {
  created: 14124214124124,
  creator: "creator-id",
  id: "id",
  json: {
    blocks: [],
    channels: {
      always: [],
      bestOf: [],
    },
  },
  objtype: "notification",
  tenantId: "tenantId",
  title: "title",
};

export const NOTIFICATION_WITH_ARCHIVED_CONFIGURATIONS: INotificationWire = {
  created: 14124214124124,
  creator: "creator-id",
  id: "id",
  json: {
    blocks: [],
    channels: {
      always: [
        {
          blockIds: [],
          id: "1",
          providers: [{ configurationId: "41", key: "archived" }],
          taxonomy: "",
        },
      ],
      bestOf: [
        {
          blockIds: [],
          id: "1",
          providers: [{ configurationId: "41", key: "archived" }],
          taxonomy: "",
        },
      ],
    },
  },
  objtype: "notification",
  tenantId: "tenantId",
  title: "title",
};
