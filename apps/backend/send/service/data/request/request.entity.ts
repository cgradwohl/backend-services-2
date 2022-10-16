import { getHashFromRange } from "~/lib/get-hash-from-range";
import { TenantRouting, TenantScope } from "~/types.internal";
import { ArgumentRequiredError } from "../errors";
import { PARTITION_SHARD_RANGE } from "../lib";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ApiVersion } from "~/send/types";
import { IRequestItem, IRequestItemKey } from "./request.types";
import { SendDataEntity } from "../types";

export type RequestConstructorItem = Omit<
  IRequestItem,
  "created" | "shard" | "updated"
> & {
  created?: string;
  shard?: number;
  updated?: string;
  translated?: boolean;
};

// TODO: Added initializers and assertions
export class Request implements IRequestItem {
  apiVersion: ApiVersion = "2019-04-01";
  created!: string;
  dryRunKey: TenantRouting | undefined;
  idempotencyKey: string | undefined;
  filePath!: string;
  jobId: string | undefined;
  requestId!: string;
  scope: TenantScope = "draft/production";
  source: string | undefined;
  sequenceId: string | undefined;
  shard!: number;
  triggerId: string | undefined;
  translated: boolean;
  updated!: string;
  workspaceId!: string;

  constructor({
    apiVersion,
    created,
    dryRunKey,
    idempotencyKey,
    filePath,
    jobId,
    requestId,
    scope,
    source,
    sequenceId,
    shard,
    triggerId,
    translated = false,
    updated,
    workspaceId,
  }: RequestConstructorItem) {
    const request: IRequestItem = {
      apiVersion,
      created: created ?? new Date().toISOString(),
      dryRunKey,
      filePath,
      idempotencyKey,
      jobId,
      requestId,
      scope,
      source,
      sequenceId,
      shard: shard ?? getHashFromRange(PARTITION_SHARD_RANGE),
      triggerId,
      translated,
      updated: updated ?? new Date().toISOString(),
      workspaceId,
    };
    this.validate(request);
    Object.assign(this, request);
  }

  public toItem(): IRequestItem & IRequestItemKey {
    return {
      ...this,
      ...Request.key({
        requestId: this.requestId,
        shard: this.shard,
        workspaceId: this.workspaceId,
      }),
      ___type___: SendDataEntity.request,
    };
  }

  public static fromItem(Item: DocumentClient.AttributeMap): Request {
    const {
      apiVersion,
      created, // NOTE:
      dryRunKey,
      filePath,
      idempotencyKey,
      jobId,
      requestId,
      scope,
      sequenceId,
      shard, // NOTE:
      source,
      triggerId,
      translated = false,
      updated, // NOTE:
      workspaceId,
    } = Item;
    return new Request({
      apiVersion,
      created,
      dryRunKey,
      filePath,
      idempotencyKey,
      jobId,
      requestId,
      scope,
      source,
      sequenceId,
      shard,
      translated,
      triggerId,
      updated,
      workspaceId,
    });
  }

  public static key(params: {
    requestId: string;
    shard?: number;
    workspaceId: string;
  }): IRequestItemKey {
    const { requestId, shard, workspaceId } = params;
    return {
      pk: `request/${requestId}`,
      sk: `request/${requestId}`,
      gsi3pk: `workspace/${workspaceId}/${
        shard ?? getHashFromRange(PARTITION_SHARD_RANGE)
      }`,
      gsi3sk: `workspace/${workspaceId}/${
        shard ?? getHashFromRange(PARTITION_SHARD_RANGE)
      }/request/${requestId}`,
    };
  }

  protected validate(item: IRequestItem) {
    const { workspaceId, requestId, filePath } = item;

    if (!workspaceId) {
      throw new ArgumentRequiredError("workspaceId is required.");
    }
    if (!requestId) {
      throw new ArgumentRequiredError("requestId is required.");
    }
    if (!filePath) {
      throw new ArgumentRequiredError("filePath is required.");
    }
  }
}

export { IRequestItem };
