import { IPolicy } from "../types";

const policy: IPolicy = {
  statements: [
    {
      actions: [
        "analytics:*",
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
      resources: ["*"],
    },
  ],
  version: "2020-11-09",
};

export default policy;
