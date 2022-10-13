// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { AutomationStepStatus, IUpdateProfileStep } from "~/automations/types";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import stepsService from "~/automations/lib/services/steps";
import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";

const getCurrentProfileJson = async (tenantId: string, recipientId: string) => {
  let currentProfile = await getProfile(tenantId, recipientId);
  currentProfile = currentProfile ? currentProfile.json : {};
  const currentProfileJson =
    typeof currentProfile === "string"
      ? JSON.parse(currentProfile)
      : currentProfile;
  return currentProfileJson;
};

export default async (step: IUpdateProfileStep, params: any) => {
  const { dryRunKey, scope, source } = params;
  const { tenantId, merge, profile, recipient_id: recipientId } = step;

  const steps = stepsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processing);

  switch (merge) {
    case "replace": {
      // overwrite all properties in B from A;
      // remove in properties in B that do not exist in A
      await updateProfile(tenantId, recipientId, {
        json: JSON.stringify(profile),
      });
      break;
    }
    case "overwrite": {
      // overwrite all properties in B from A
      const currentProfileJson = await getCurrentProfileJson(
        tenantId,
        recipientId
      );
      const mergedProfile = jsonMerger.mergeObjects([
        currentProfileJson,
        profile,
      ]);

      if (mergedProfile && Object.keys(mergedProfile).length) {
        await updateProfile(tenantId, recipientId, {
          json: JSON.stringify(mergedProfile),
        });
      }
      break;
    }
    case "soft-merge": {
      // only overwrite properties in B from A that do not yet exist in B
      const currentProfileJson = await getCurrentProfileJson(
        tenantId,
        recipientId
      );

      const mergedProfile = {
        ...profile,
        ...currentProfileJson,
      };

      if (mergedProfile && Object.keys(mergedProfile).length) {
        await updateProfile(tenantId, recipientId, {
          json: JSON.stringify(mergedProfile),
        });
      }
      break;
    }
    case "none": {
      // do not make an changes to B if B already exists; else B = A
      const currentProfile = await getProfile(tenantId, recipientId);
      if (!currentProfile && Object.keys(profile).length) {
        await updateProfile(tenantId, recipientId, {
          json: JSON.stringify(profile),
        });
      }
      break;
    }
    default: {
      //Should not enter as cases are validated beforehand
    }
  }
  await steps.markStepStatus(step, AutomationStepStatus.processed);

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
};
