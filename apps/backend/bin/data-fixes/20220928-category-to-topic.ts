import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import * as categoryService from "~/lib/category-service";
import logger from "~/lib/logger";
import { isCustomTierTenantId } from "~/lib/plan-pricing";
import { mapCategoryToSubscriptionTopic } from "~/lib/preferences/map-category-to-subscription-topic";
import { preferenceSectionService } from "~/preferences/services/section-service";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { Handler, IDataFixEvent } from "./types";
import { nanoid } from "nanoid";
import { toApiKey } from "~/lib/api-key-uuid";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  isCustomTier?: boolean;
  lastEvaluatedKey?: string;
  placeHolderSectionId?: string;
  tenantId: string;
  environment?: "production" | "test";
}

async function fetchSectionId(
  isCustomTier: boolean,
  // default sectionId is falsey by design
  sectionId = "",
  workspaceId: string
): Promise<string> {
  const sectionService = preferenceSectionService(workspaceId, "default");
  let placeHolderSectionId = nanoid();
  /*
    we want to create a separate section called `Migrated Categories` for custom tier tenants
    and add the topics to that section instead of the default section
  */
  if (isCustomTier && !sectionId) {
    await sectionService.saveSection({
      sectionId: placeHolderSectionId,
      name: "Migrated Categories",
      routingOptions: ["push", "email", "direct_message"],
      _meta: "migrated-categories",
    });
  }
  /*
    if tenantId is not on custom tier, we want to add the topics to the default section
  */
  if (!(isCustomTier || sectionId)) {
    const { Items: sections } = await sectionService.list();
    const [defaultSection] = sections;
    logger.debug(
      `Found default section: ${defaultSection?.sectionId}/${defaultSection.name}`
    );
    placeHolderSectionId = defaultSection.sectionId;
  }
  return placeHolderSectionId;
}

/*
  In order to execute this lambda, you need to execute `BinInvokeForTenants` lambda with the following payload:
  {
    "lambdaFn": "BinDataFix",
    "filename": "20220928-category-to-topic",
  }
*/

const handler: Handler<IEvent> = async (event, context: Context) => {
  const {
    tenantId,
    placeHolderSectionId = "",
    environment = "production",
  } = event;

  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  const workspaceId =
    environment === "production" ? tenantId : `${tenantId}/test`;

  const sectionService = preferenceSectionService(workspaceId, "default");
  const isCustomTier =
    event.isCustomTier ?? (await isCustomTierTenantId(workspaceId));

  logger.debug(`[workspace/${workspaceId}] isCustomTier: ${isCustomTier}`);

  if (isCustomTier === null) {
    logger.debug(`[workspace/${workspaceId}] is is archived, aborting`);
    return;
  }

  const { objects: allCategories, lastEvaluatedKey } =
    await categoryService.list({ tenantId: workspaceId });

  if (!allCategories.length) {
    logger.debug(`[workspace/${workspaceId}] no categories found`);
    return;
  }

  const sectionId = await fetchSectionId(
    isCustomTier,
    placeHolderSectionId,
    workspaceId
  );

  await Promise.all(
    allCategories.map(async (category) => {
      const subscriptionTopic = mapCategoryToSubscriptionTopic(category);
      logger.debug(
        `[workspace/${workspaceId}] migrating category: ${category.id}/${category.title} to section: ${sectionId}`
      );

      logger.debug(`Category status: ${category.json.notificationConfig.type}`);
      const subscriptionTopicService = preferenceTemplateService(
        workspaceId,
        subscriptionTopic.creatorId
      );
      // Migrate category to subscription topic
      await subscriptionTopicService.update(subscriptionTopic);
      // update section with the newly migrated topic
      return sectionService.updateSectionForGroup(
        sectionId,
        toApiKey(subscriptionTopic.templateId)
      );
    })
  );

  // Tail recursion
  if (lastEvaluatedKey) {
    logger.debug(`Invoking next batch for tenant ${workspaceId}`);
    const { functionName } = context;
    await lambda.invoke({
      FunctionName: functionName,
      InvocationType: "Event",
      Payload: JSON.stringify({
        tenantId: workspaceId,
        lastEvaluatedKey,
        sectionId,
      }),
    });
  }
};

export default handler;
