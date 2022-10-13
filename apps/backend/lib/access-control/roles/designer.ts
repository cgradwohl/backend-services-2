import { DefaultPolicy, DesignerPolicy } from "../policies";
import { IRole } from "../types";

const role: IRole = {
  key: "DESIGNER",
  label: "Designer",
  description:
    "Has the ability to update templates and brands but can't update integrations or settings.",
  policies: [DefaultPolicy, DesignerPolicy],
};

export default role;
