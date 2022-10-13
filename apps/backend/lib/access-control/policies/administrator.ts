import { IPolicy } from "../types";

const policy: IPolicy = {
  statements: [
    {
      actions: ["*"],
      effect: "ALLOW",
      resources: ["*"],
    },
  ],
  version: "2020-11-09",
};

export default policy;
