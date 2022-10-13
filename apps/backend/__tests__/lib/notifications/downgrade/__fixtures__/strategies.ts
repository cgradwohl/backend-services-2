import { IStrategy } from "~/types.api";

export const strategy: IStrategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: ["configuration-1"],
    configurations: [
      "configuration-1",
      "configuration-2",
      "configuration-3",
      "configuration-4",
    ],
  },
  objtype: "strategy",
  id: "78bbe2ed-37ad-4780-8d1f-59b289f8f14b",
  title: "Notification Rules",
};

export const noEmail: IStrategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: [],
    configurations: ["configuration-2", "configuration-3", "configuration-4"],
  },
  objtype: "strategy",
  id: "4ef489c7-5d23-4696-984a-610d28d1f4d7",
  title: "Notification Rules",
};

export const noExpo: IStrategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: ["configuration-1"],
    configurations: ["configuration-1", "configuration-3", "configuration-4"],
  },
  objtype: "strategy",
  id: "67f6d2af-53e0-4761-bd83-65ffcb113ffa",
  title: "Notification Rules",
};

export const noFacebookMessenger: IStrategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: ["configuration-1"],
    configurations: ["configuration-1", "configuration-2", "configuration-4"],
  },
  objtype: "strategy",
  id: "2c6a5416-e2d5-4229-a40f-833f3e28b71a",
  title: "Notification Rules",
};

export const emptyStrategy: IStrategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: [],
    configurations: [],
  },
  objtype: "strategy",
  id: "5639e334-4b3c-4243-8e29-132ce7b95b2b",
  title: "Notification Rules",
};
