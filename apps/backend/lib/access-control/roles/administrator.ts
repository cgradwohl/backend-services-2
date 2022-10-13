import { AdministratorPolicy } from "../policies";
import { IRole } from "../types";

const role: IRole = {
  key: "ADMINISTRATOR",
  label: "Administrator",
  description:
    "Best for company administrators and business owners.  Has permissions for everything.",
  policies: [AdministratorPolicy],
};

export default role;
