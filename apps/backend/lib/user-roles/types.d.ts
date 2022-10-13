import { IRole } from "../access-control/types";

export interface IUserRoleService {
  delete: (key: string) => Promise<void>;
  get: (key: string) => Promise<IRole>;
  list: () => Promise<IRole[]>;
  replace: (role: IRole) => Promise<void>;
}
