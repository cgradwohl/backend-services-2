import { IPolicy } from "../types";

const policy: IPolicy = {
  statements: [
    {
      actions: [
        "apikey:ReadItem",
        "apikey:ListItems",
        "automationLogs:*",
        "automationTemplate:*",
        "brand:*",
        "category:*",
        "integration:*",
        "list:*",
        "message:*",
        "preferenceTemplate:*",
        "recipient:*",
        "template:*",
        "webhook:*",
      ],
      effect: "ALLOW",
      resources: ["test/*"],
    },
    {
      actions: [
        "message:ListItems",
        "message:ReadItem",
        "automationLogs:ListItems",
        "automationLogs:ReadItem",
        "automationTemplate:ListItems",
        "automationTemplate:ReadItem",
      ],
      effect: "ALLOW",
      resources: ["*"],
    },
  ],
  version: "2020-11-09",
};

export default policy;
