import { DefaultPolicy, ManagerPolicy } from "../policies";
import { IRole } from "../types";

const role: IRole = {
  key: "MANAGER",
  label: "Manager",
  description:
    "Best for a manager of a team that doesn't need the ability to update users or billing.",
  policies: [DefaultPolicy, ManagerPolicy],
};

export default role;
