import { IPolicy } from "../types";

const policy: IPolicy = {
  statements: [
    {
      actions: [
        "analytics:*",
        "brand:ListItems",
        "brand:ReadItem",
        "category:ListItems",
        "category:ReadItem",
        "integration:ListItems",
        "integration:ReadItem",
        "list:ListItems",
        "list:ReadItem",
        "metrics:GetMetrics",
        "template:ListItems",
        "template:ReadItem",
        "user:ListItems",
        "user:ReadItem",
      ],
      effect: "ALLOW",
      resources: ["*"],
    },
  ],
  version: "2020-11-09",
};

export default policy;
