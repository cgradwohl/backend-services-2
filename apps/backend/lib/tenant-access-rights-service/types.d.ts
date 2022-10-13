import { DocumentClient } from "aws-sdk/clients/dynamodb";

export type Role =
  | "ADMINISTRATOR"
  | "MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "SUPPORT_SPECIALIST"
  | "ANALYST"
  | string;

export interface ITenantAccessRightKey extends DocumentClient.Key {
  tenantId: string;
  userId: string;
}

export interface ITenantAccessRight {
  tenantId: string;
  userId: string;
  created: number;
  creator: string;
  passwordLastChanged?: number;
  role?: Role;
  isCourierEmployee?: boolean;
}
