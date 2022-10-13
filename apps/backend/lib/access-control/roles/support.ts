import { DefaultPolicy, SupportPolicy } from "../policies";
import { IRole } from "../types";

const role: IRole = {
  key: "SUPPORT_SPECIALIST",
  label: "Support",
  description:
    "Best for customer support specialists regularly use the platform but don't need to update templates or brands.",
  policies: [DefaultPolicy, SupportPolicy],
};

export default role;
