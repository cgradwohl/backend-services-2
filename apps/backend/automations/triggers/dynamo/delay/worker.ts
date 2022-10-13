import { DynamoDBStreamEvent } from "aws-lambda";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import { IBackwardsCompatibleDelayStepWorkerItem } from "~/automations/types";
import dynamoToJson from "~/lib/dynamo/to-json";
import delayService from "~/automations/lib/services/delay";

export default async (event: DynamoDBStreamEvent) => {
  const { eventName, dynamodb } = event.Records[0];

  if (eventName === "REMOVE") {
    const { OldImage } = dynamodb;

    const stepWorkerItem =
      dynamoToJson<IBackwardsCompatibleDelayStepWorkerItem>(OldImage);
    const { dryRunKey, runId, scope, source, stepId, tenantId, expirydate } =
      stepWorkerItem;

    if (expirydate) {
      //If an expirydate is set, start a step function to end at that time
      const date = new Date(expirydate * 1000);

      const delay = new delayService(stepWorkerItem);
      return delay.startDelayStepFunction(date.toISOString(), {
        dryRunKey,
        scope,
        source,
      });
    }

    //If no expirydate is set, enqueue the next step
    //This is done for backwards compatibility as legacy delay entries won't have an expirydate
    return enqueueAutomationStep({
      dryRunKey,
      runId,
      scope,
      source,
      stepId,
      tenantId,
    });
  }
};
