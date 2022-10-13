import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { nanoid } from "nanoid";
import { ArgumentRequiredError } from "../data/errors";
import { SendDataEntity, SendDyanmoItem } from "../data/types";
import {
  IScheduleJobItem,
  IScheduleJobItemKey,
  ScheduleJobConstructorItem,
} from "./schedule-job.types";

export class ScheduleJob implements IScheduleJobItem {
  created: string;
  expiration: number;
  messageId: string;
  messageFilePath: string;
  requestId: string;
  scheduleJobId: string;
  updated: string;
  workspaceId: string;

  constructor({
    created,
    expiration,
    messageId,
    messageFilePath,
    requestId,
    scheduleJobId,
    updated,
    workspaceId,
  }: ScheduleJobConstructorItem) {
    const scheduleJob: IScheduleJobItem = {
      created: created ?? new Date().toISOString(),
      expiration,
      messageId,
      messageFilePath,
      requestId,
      scheduleJobId: scheduleJobId ?? nanoid(),
      updated: updated ?? new Date().toISOString(),
      workspaceId,
    };

    this.validate(scheduleJob);

    Object.assign(this, scheduleJob);
  }

  public toItem(): IScheduleJobItem & IScheduleJobItemKey & { ttl: number } {
    return {
      ...this,
      ...ScheduleJob.key({
        scheduleJobId: this.scheduleJobId,
      }),
      ttl: this.expiration,
      ___type___: SendDataEntity.scheduleJob,
    };
  }

  public static fromItem(Item: DocumentClient.AttributeMap): ScheduleJob {
    const {
      created,
      expiration,
      messageId,
      messageFilePath,
      scheduleJobId,
      requestId,
      updated,
      workspaceId,
    } = Item;

    return new ScheduleJob({
      created,
      expiration,
      messageId,
      messageFilePath,
      scheduleJobId,
      requestId,
      updated,
      workspaceId,
    });
  }

  public static key(params: { scheduleJobId: string }): IScheduleJobItemKey {
    const { scheduleJobId } = params;
    return {
      pk: `scheduleJob/${scheduleJobId}`,
      sk: `scheduleJob/${scheduleJobId}`,
    };
  }

  protected validate(item: IScheduleJobItem) {
    const { expiration, messageId, messageFilePath, requestId, workspaceId } =
      item;

    if (!expiration) {
      throw new ArgumentRequiredError(
        "expiration is a required property of ScheduleJob."
      );
    }

    if (!messageId) {
      throw new ArgumentRequiredError(
        "messageId is a required property of ScheduleJob."
      );
    }

    if (!messageFilePath) {
      throw new ArgumentRequiredError(
        "messageFilePath is a required property of ScheduleJob."
      );
    }
    if (!requestId) {
      throw new ArgumentRequiredError(
        "requestId is a required property of ScheduleJob."
      );
    }
    if (!workspaceId) {
      throw new ArgumentRequiredError(
        "workspaceId is a required property of ScheduleJob."
      );
    }
  }
}
