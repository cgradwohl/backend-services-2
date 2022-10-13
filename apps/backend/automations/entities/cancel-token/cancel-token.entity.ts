import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getHashFromRange } from "~/lib/get-hash-from-range";
import {
  ArgumentRequiredError,
  AutomationEntity,
  InvalidAutomationEntityError,
} from "../types";
import {
  AutomationCancelTokenConstructorItem,
  IAutomationCancelTokenItem,
  IAutomationCancelTokenItemKey,
} from "./cancel-token.types";

export class AutomationCancelToken implements IAutomationCancelTokenItem {
  runId: string;
  token: string;
  created: string;
  updated: string;
  tenantId: string;
  ___type___: AutomationEntity.CancelToken;

  constructor({
    created,
    runId,
    token,
    tenantId,
    updated,
  }: AutomationCancelTokenConstructorItem) {
    const cancelToken: IAutomationCancelTokenItem = {
      created: created ?? new Date().toISOString(),
      runId,
      token,
      updated: updated ?? new Date().toISOString(),
      tenantId,
      ___type___: AutomationEntity.CancelToken,
    };
    this.validate(cancelToken);
    Object.assign(this, cancelToken);
  }

  public static fromItem(Item: DocumentClient.AttributeMap) {
    const { created, runId, shard, token, tenantId, updated } = Item;

    if (!created) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'created'."
      );
    }

    if (!updated) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'updated'."
      );
    }

    return new AutomationCancelToken({
      created,
      runId,
      shard,
      token,
      tenantId,
      updated,
    });
  }

  public toItem(): IAutomationCancelTokenItem & IAutomationCancelTokenItemKey {
    return {
      ...this,
      ...AutomationCancelToken.key({
        runId: this.runId,
        tenantId: this.tenantId,
        token: this.token,
      }),
    };
  }

  public static key(params: {
    runId: string;
    tenantId: string;
    token: string;
  }): IAutomationCancelTokenItemKey {
    const { runId, tenantId, token } = params;
    return {
      pk: `${tenantId}/${token}`,
      sk: `${token}/run/${runId}`,
    };
  }

  protected validate(item: IAutomationCancelTokenItem) {
    const { runId, tenantId, token } = item;

    if (!runId) {
      throw new ArgumentRequiredError("runId is required.");
    }
    if (!tenantId) {
      throw new ArgumentRequiredError("tenantId is required.");
    }
    if (!token) {
      throw new ArgumentRequiredError("token is required.");
    }
    const tokenSize = Buffer.byteLength(token, "utf-8");

    if (tokenSize > 1024) {
      throw new InvalidAutomationEntityError(
        "Invalid Automation Token. The token must not exceed 1024 characters."
      );
    }
  }
}
