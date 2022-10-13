import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface ISessionManagementKey extends DocumentClient.Key {
  namespace: string;
}

export interface ISessionManagement {
  namespace: string;
  passwordLastChanged?: number;
}

export interface ICreateSessionManagementFn<ISessionManagement> {
  (data: ISessionManagement): Promise<void>;
}
