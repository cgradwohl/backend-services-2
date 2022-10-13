import {
  CourierObject,
  EventJsonWire,
  IConfigurationJson,
  INotificationJsonWire,
} from "~/types.api";
import { IGetFn } from "~/lib/dynamo/object-service/types";

type DeleteResult =
  | { status: "ok" }
  | { notifications: Array<{ id: string; title: string }>; status: "error" };

export type DeleteFn = (
  tenantId: string,
  id: string,
  userId: string
) => Promise<DeleteResult>;

export type Env = "production" | "test";
export type Arg = CourierObject<INotificationJsonWire | EventJsonWire>;
export type GetConfigurationByEnvFn = (
  configuration: CourierObject<IConfigurationJson>,
  env: Exclude<Env, "production">
) => CourierObject<IConfigurationJson>;
