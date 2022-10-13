import { IPolicy } from "../types";

const policy: IPolicy = {
  statements: [
    {
      actions: [
        "automationTemplate:*",
        "brand:*",
        "category:*",
        "preferenceTemplate:*",
        "template:*",
      ],
      effect: "ALLOW",
      resources: ["*"],
    },
  ],
  version: "2020-11-09",
};

export default policy;
