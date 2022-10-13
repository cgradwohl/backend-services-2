import { DefaultPolicy } from "../policies";
import { IRole } from "../types";

const role: IRole = {
  key: "ANALYST",
  label: "Analyst",
  description:
    "Best for users who need full read-only access to the platform (except logs).",
  policies: [DefaultPolicy],
};

export default role;
