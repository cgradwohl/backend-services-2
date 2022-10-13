import { DefaultPolicy, DeveloperPolicy } from "../policies";
import { IRole } from "../types";

const role: IRole = {
  key: "DEVELOPER",
  label: "Developer",
  description:
    "Best for engineers and developers who will primarily work with Courier's API and template designer.",
  policies: [DefaultPolicy, DeveloperPolicy],
};

export default role;
