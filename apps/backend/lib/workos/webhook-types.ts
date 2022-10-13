export type WorkOsWebhook =
  | DSyncUserCreated
  | DSyncUserDeleted
  | DSyncUserUpdated;

export type DSyncUserCreated = WebhookTemplate<"dsync.user.created", UserData>;
export type DSyncUserDeleted = WebhookTemplate<"dsync.user.deleted", UserData>;
export type DSyncUserUpdated = WebhookTemplate<"dsync.user.updated", UserData>;

export interface WebhookTemplate<Event extends string, Data> {
  id: string;
  data: Data;
  event: Event;
}

export interface UserData {
  id: string;
  directory_id: string;
  idp_id: string;
  emails: { primary: boolean; type: string; value: string }[];
  first_name: string;
  last_name: string;
  username: string;
  state: "active" | "suspended";
  custom_attributes: any;
  raw_attributes: unknown;
}
