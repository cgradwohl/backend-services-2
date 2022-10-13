import { IPolicy } from "../types";

const policy: IPolicy = {
  statements: [
    {
      actions: [
        "automationLogs:*",
        "list:*",
        "message:*",
        "preferenceTemplate:ListItems",
        "preferenceTemplate:ReadItem",
        "recipient:*",
      ],
      effect: "ALLOW",
      resources: ["*"],
    },
  ],
  version: "2020-11-09",
};

export default policy;
