import { RequestV2 } from "~/api/send/types";
import { ApiVersion } from "~/send/types";
import { TenantRouting, TenantScope } from "~/types.internal";
import { SendDyanmoItem } from "../types";

type workspaceId = string;
type shard = number;
type requestId = string;

export interface IRequestItemKey {
  pk: `request/${requestId}`;
  sk: `request/${requestId}`;
  gsi3pk: `workspace/${workspaceId}/${shard}`;
  gsi3sk: `workspace/${workspaceId}/${shard}/request/${requestId}`;
}
export interface IRequestItem extends SendDyanmoItem {
  apiVersion: ApiVersion;
  dryRunKey: TenantRouting | undefined;
  idempotencyKey: string | undefined;
  filePath: string;
  jobId: string | undefined;
  originFilePath: string;
  requestId: string;
  scope: TenantScope;
  source: string | undefined;
  sequenceId: string | undefined;
  shard: number;
  triggerId: string | undefined;
  translated: boolean;
}

export type RequestParams = Record<
  | "originalRequestId"
  | "sequenceId"
  | "sequenceActionId"
  | "nextSequenceActionId",
  string | undefined
>;

export type RequestCreateItem = Omit<
  IRequestItem,
  "created" | "filePath" | "shard" | "updated" | "workspaceId"
> & { params?: RequestParams; request: RequestV2; translated?: boolean };

export type RequestPayload = IRequestItem & {
  message: RequestV2["message"];
  params?: RequestParams;
};
