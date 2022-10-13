import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getHashFromRange } from "~/lib/get-hash-from-range";
import { TenantRouting } from "~/types.internal";
import {
  AutomationRunConstructorItem,
  IAutomationRunItem,
  IAutomationRunItemKey,
} from "./run.types";
import {
  ArgumentRequiredError,
  AutomationEntity,
  InvalidAutomationEntityError,
} from "../types";

const PARTITION_SHARD_RANGE = 10;

export class AutomationRun implements IAutomationRunItem {
  created: string;
  cancelationToken: string;
  context: string;
  dryRunKey?: TenantRouting;
  runId: string;
  scope: string;
  source: string[];
  status: string;
  shard: number;
  updated: string;
  tenantId: string;
  ___type___: AutomationEntity.Run;

  constructor({
    created,
    cancelationToken,
    context,
    dryRunKey,
    runId,
    scope,
    source,
    status,
    shard,
    updated,
    tenantId,
  }: AutomationRunConstructorItem) {
    const run: IAutomationRunItem = {
      created: created ?? new Date().toISOString(),
      cancelationToken: cancelationToken ?? "",
      context,
      dryRunKey,
      runId,
      scope,
      source,
      status,
      shard: shard ?? getHashFromRange(PARTITION_SHARD_RANGE),
      tenantId,
      updated: updated ?? new Date().toISOString(),
      ___type___: AutomationEntity.Run,
    };
    this.validate(run);
    Object.assign(this, run);
  }

  public static fromItem(Item: DocumentClient.AttributeMap): AutomationRun {
    const {
      created,
      cancelationToken,
      context,
      dryRunKey,
      runId,
      scope,
      source,
      status,
      shard,
      updated,
      tenantId,
    } = Item;

    if (!created) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'created'."
      );
    }

    if (!shard) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'shard'."
      );
    }

    if (!updated) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'updated'."
      );
    }

    return new AutomationRun({
      created,
      cancelationToken,
      context,
      dryRunKey,
      runId,
      scope,
      source,
      status,
      shard,
      updated,
      tenantId,
    });
  }

  public toItem(): IAutomationRunItem & IAutomationRunItemKey {
    return {
      ...this,
      ...AutomationRun.key({
        runId: this.runId,
      }),
    };
  }

  public static key(params: { runId: string }): IAutomationRunItemKey {
    const { runId } = params;
    return {
      pk: `${runId}`,
      sk: `${runId}`,
    };
  }

  protected validate(item: IAutomationRunItem) {
    const { runId, shard, tenantId } = item;

    if (!runId) {
      throw new ArgumentRequiredError("runId is required.");
    }
    if (!shard) {
      throw new ArgumentRequiredError("shard is required.");
    }
    if (!tenantId) {
      throw new ArgumentRequiredError("tenantId is required.");
    }
  }
}
