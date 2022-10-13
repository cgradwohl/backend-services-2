import makeError from "make-error";
import {
  IAutomationTemplate,
  IAutomationTemplateAlias,
  IAutomationTemplateSource,
  IAutomationTemplatesService,
  IRenderedAutomationTemplate,
} from "~/automations/types";
import Jsonnet from "~/lib/jsonnet";
import jsonnetHelpers from "~/lib/jsonnet/helpers";
import { TenantScope } from "~/types.internal";
import {
  DuplicateTemplateAliasError,
  InvalidAutomationTemplate,
} from "../errors";
import automationTemplateStore from "../stores/automation-template-store";
import {
  deleteItem,
  getItem,
  put as putItem,
  query,
  transactWrite,
  update,
} from "../stores/dynamo";
import schedulerService from "./scheduler";

const jsonnet = new Jsonnet();
export const JsonnetEvalError = makeError("JsonnetEvalError");

export default (
  tenantId: string,
  scope: TenantScope
): IAutomationTemplatesService => {
  const scheduler = schedulerService(tenantId, scope);

  // helpers
  const getTemplateDynamoKey = (templateId: string) => ({
    pk: tenantId,
    sk: `template/${templateId}`,
  });

  const getAliasDynamoKey = (alias: string) => ({
    pk: tenantId,
    sk: `alias/${alias}`,
  });

  const getAliasMappingDynamoKey = (templateId: string) => ({
    pk: tenantId,
    sk: `alias-mapping/${templateId}`,
  });

  const getTemplateSourceDynamoKey = (source: string, templateId: string) => ({
    pk: tenantId,
    sk: `source/${source}/template/${templateId}`,
    gsi1pk: tenantId,
    gsi1sk: `template/${templateId}/source/${source}`,
  });

  const getObjectKey = (tenantId: string, templateId: string) =>
    `${tenantId}/templates/${templateId}.json`;

  const ifTemplateExists = async (templateId: string): Promise<boolean> => {
    const { Item } = await getItem({
      Key: getTemplateDynamoKey(templateId),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    return undefined !== Item;
  };

  const listIds = async (tenantId: string): Promise<string[]> => {
    const { Items } = await query({
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": tenantId,
        ":sk": `template/`,
      },
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    if (!Items.length) {
      return [];
    }

    return [...new Set(Items.map((item) => item.templateId))];
  };

  const listIdsBySource = async (source: string): Promise<string[]> => {
    const { Items } = await query({
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": tenantId,
        ":sk": `source/${source}/template/`,
      },
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    if (!Items.length) {
      return [];
    }

    return [...new Set(Items.map((item) => item.templateId))];
  };

  const render = (
    template: string,
    data = {},
    profile = {}
  ): IRenderedAutomationTemplate => {
    try {
      const code = `
      ${jsonnetHelpers(data, profile)}
      ${template}`;

      return jsonnet.eval(code);
    } catch (error) {
      throw new JsonnetEvalError(error);
    }
  };

  const getListOfStringSources = (
    items: IAutomationTemplateSource[]
  ): string[] => {
    return [...new Set(items.map((item) => item.source))];
  };

  const fetchPublishedSourcesByTemplateId = async (
    templateId: string
  ): Promise<IAutomationTemplateSource[]> => {
    const { Items } = await query({
      ExpressionAttributeNames: {
        "#gsi1pk": "gsi1pk",
        "#gsi1sk": "gsi1sk",
      },
      ExpressionAttributeValues: {
        ":gsi1pk": tenantId,
        ":gsi1sk": `template/${templateId}/source/`,
      },
      IndexName: "gsi1",
      KeyConditionExpression:
        "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)",
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    if (!Items.length) {
      return [];
    }

    return Items.map((Item) => ({
      templateId: Item.templateId,
      tenantId: Item.tenantId,
      source: Item.source,
      createdAt: Item.createdAt,
      type: Item.type,
    }));
  };

  const deleteSource = async (templateId: string, source: string) => {
    await deleteItem({
      Key: {
        pk: tenantId,
        sk: `source/${source}/template/${templateId}`,
      },
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });
  };

  const saveSource = async (
    templateId: string,
    newSource: string,
    oldSource: string
  ): Promise<IAutomationTemplateSource> => {
    const newSourceAttributes = {
      tenantId,
      templateId,
      source: newSource,
      type: "automation-source" as "automation-source",
    };

    // No need to resave if the source stays the same
    if (oldSource === newSource) {
      return newSourceAttributes;
    }

    const createdAt = new Date().toISOString();
    await putItem({
      Item: {
        ...getTemplateSourceDynamoKey(newSource, templateId),
        ...newSourceAttributes,
        createdAt,
      },
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    // Delete the old source if a valid value existed before
    if (oldSource) {
      await deleteSource(templateId, oldSource);
    }

    return { ...newSourceAttributes, createdAt };
  };

  const fetchAlias = async (
    alias: string
  ): Promise<IAutomationTemplateAlias> => {
    const { Item: item } = await getItem({
      Key: getAliasDynamoKey(alias),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    if (!item) {
      return null;
    }

    return {
      alias: item.alias,
      templateId: item.templateId,
      tenantId: item.tenantId,
      type: item.type,
      updated: item.updated,
    };
  };

  const fetchAliasByTemplateId = async (
    templateId: string
  ): Promise<IAutomationTemplateAlias> => {
    const { Item: item } = await getItem({
      Key: getAliasMappingDynamoKey(templateId),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    if (!item) {
      return null;
    }

    return {
      alias: item.alias,
      templateId: item.templateId,
      tenantId: item.tenantId,
      type: item.type,
      updated: item.updated,
    };
  };

  const deleteExistingAlias = async (templateId: string) => {
    // delete alias item
    const aliasItem = await fetchAliasByTemplateId(templateId);

    if (!aliasItem) {
      return;
    }

    await deleteItem({
      Key: getAliasDynamoKey(aliasItem.alias),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    // delete mapping item
    await deleteItem({
      Key: getAliasMappingDynamoKey(templateId),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });
  };

  const createAlias = async (alias: string, templateId: string) => {
    const updateExpressions = [
      "#alias = :alias",
      "#templateId = :templateId",
      "#tenantId = :tenantId",
      "#type = :type",
      "#updated = :updated",
    ];

    const ExpressionAttributeNames = {
      "#alias": "alias",
      "#templateId": "templateId",
      "#tenantId": "tenantId",
      "#type": "type",
      "#updated": "updated",
    };

    const ExpressionAttributeValues = {
      ":alias": alias,
      ":templateId": templateId,
      ":tenantId": tenantId,
      ":updated": new Date().toISOString(),
    };

    // create alias item
    await update({
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ":type": "automation-template-alias",
      },
      Key: getAliasDynamoKey(alias),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    });

    // create mapping item
    await update({
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ":type": "automation-template-alias-mapping",
      },
      Key: getAliasMappingDynamoKey(templateId),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    });
  };

  const get = async (
    templateId: string
  ): Promise<IAutomationTemplate | null> => {
    const { Item: item } = await getItem({
      Key: getTemplateDynamoKey(templateId),
      TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
    });

    if (!item) {
      return null;
    }

    const key = getObjectKey(tenantId, templateId);

    let templateJSON = null;
    let templateJsonnet = item.template;
    try {
      if (scope.indexOf("draft") > -1) {
        templateJsonnet = await automationTemplateStore.get(key);
        if (templateJsonnet.hasOwnProperty("json")) {
          templateJSON = templateJsonnet.json;
          templateJsonnet = null;
        }
      } else {
        templateJsonnet = await automationTemplateStore.getByVersionId(
          key,
          item.publishedVersion
        );

        if (templateJsonnet.hasOwnProperty("json")) {
          templateJSON = templateJsonnet.json;
          templateJsonnet = null;
        }
      }
    } catch (error) {
      // eat the error and keep templateJsonnet = item.template
    }

    return {
      alias: item.alias ?? `ALIAS_${templateId}`, // provide default for back compat
      cancelation_token: item.cancelationToken ?? null,
      createdAt: item.createdAt,
      publishedAt: item.publishedAt,
      publishedVersion: item.publishedVersion,
      updatedAt: item.updatedAt,
      name: item.name,
      template: templateJsonnet,
      json: templateJSON,
      templateId,
      tenantId,
      type: "automation-template",
    };
  };

  // public service
  return {
    render,

    listBySource: async (source: string): Promise<IAutomationTemplate[]> => {
      const templateIds = await listIdsBySource(source);

      return Promise.all(
        templateIds.map((templateId: string) => {
          return get(templateId);
        })
      );
    },

    fetchPublishedSourcesByTemplateId,

    deleteSource,

    saveSource,

    updateCancelationToken: async (
      token: string,
      templateId: string
    ): Promise<string> => {
      const templateExists = await ifTemplateExists(templateId);
      if (!templateExists) {
        throw new Error("Template not found");
      }

      const updatedAt = new Date().toISOString();

      await update({
        ExpressionAttributeNames: {
          "#cancelationToken": "cancelationToken",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":cancelationToken": token,
          ":updatedAt": updatedAt,
        },
        Key: getTemplateDynamoKey(templateId),
        TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
        UpdateExpression:
          "SET #cancelationToken = :cancelationToken, #updatedAt = :updatedAt",
      });

      return updatedAt;
    },

    updateName: async (name: string, templateId: string): Promise<string> => {
      const templateExists = await ifTemplateExists(templateId);
      if (!templateExists) {
        throw new Error("Template not found");
      }

      const updatedAt = new Date().toISOString();

      await update({
        ExpressionAttributeNames: {
          "#name": "name",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":updatedAt": updatedAt,
        },
        Key: getTemplateDynamoKey(templateId),
        TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
        UpdateExpression: "SET #name = :name, #updatedAt = :updatedAt",
      });

      return updatedAt;
    },

    updateAlias: async (
      newAlias: string,
      templateId: string
    ): Promise<string> => {
      const template = await get(templateId);
      if (!template) {
        return null;
      }

      // check uniqueness of new alias in tenant partition
      const aliasItem = await fetchAlias(newAlias);

      if (aliasItem) {
        throw new DuplicateTemplateAliasError();
      }

      await deleteExistingAlias(templateId);
      await createAlias(newAlias, templateId);

      const updatedAt = new Date().toISOString();

      // update template
      await update({
        ExpressionAttributeNames: {
          "#alias": "alias",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":alias": newAlias,
          ":updatedAt": updatedAt,
        },
        Key: getTemplateDynamoKey(templateId),
        TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
        UpdateExpression: "SET #alias = :alias, #updatedAt = :updatedAt",
      });

      return updatedAt;
    },

    save: async (
      template: IAutomationTemplate
    ): Promise<{
      updatedAt: string;
    }> => {
      const templateId = template.templateId;

      const { json, template: jsonnet } = template;

      if (!json && !jsonnet) {
        throw new InvalidAutomationTemplate(
          "Template has to have either JSON or JSONNET"
        );
      }

      if (json && jsonnet) {
        throw new InvalidAutomationTemplate(
          "Template cannot map to both JSON and JSONNET."
        );
      }

      const key = getObjectKey(tenantId, templateId);
      if (jsonnet) {
        // store only the jsonnet string for JSONNET templates (deprecated)
        await automationTemplateStore.put(key, jsonnet);
      }

      if (json) {
        try {
          // store the WHOLE IAutomationTemplate type for JSON templates
          await automationTemplateStore.put(key, template);
        } catch (error) {
          throw new InvalidAutomationTemplate(error);
        }
      }

      const currentTimestamp = new Date().toISOString();

      // this method only updates alias and name on first save
      const updateExpressions = [
        "#alias = if_not_exists(#alias, :alias)",
        "#cancelationToken = if_not_exists(#cancelationToken, :cancelationToken)",
        "#createdAt = if_not_exists(#createdAt, :createdAt)",
        "#name = if_not_exists(#name, :name)",
        "#templateId = if_not_exists(#templateId, :templateId)",
        "#tenantId = :tenantId",
        "#type = if_not_exists(#type, :type)",
        "#updatedAt = :updatedAt",
      ];

      await update({
        TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
        Key: getTemplateDynamoKey(templateId),
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: {
          "#alias": "alias",
          "#cancelationToken": "cancelationToken",
          "#createdAt": "createdAt",
          "#name": "name",
          "#templateId": "templateId",
          "#tenantId": "tenantId",
          "#type": "type",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":alias": `ALIAS_${templateId}`, // provide default for first create
          ":cancelationToken": null, // provide default for first create
          ":createdAt": currentTimestamp,
          ":name": template.name, // TODO: use "Untitled" by default for first create
          ":templateId": templateId,
          ":tenantId": tenantId, // TODO: generate uuid by default for first create
          ":type": "automation-template",
          ":updatedAt": currentTimestamp,
        },
      });

      return {
        updatedAt: currentTimestamp,
      };
    },

    publish: async (
      templateId: string
    ): Promise<{
      publishedAt: string;
      publishedVersion: string;
    }> => {
      // TODO: make conditional expression
      // Cannot publish a non-existent template
      const templateExists = await ifTemplateExists(templateId);
      if (!templateExists) {
        throw new Error("Template not found");
      }

      // get the most recent draft from S3
      const key = getObjectKey(tenantId, templateId);
      const {
        versionId: publishedVersion,
        response: latestDraft,
      }: {
        versionId: string;
        response: string;
      } = await automationTemplateStore.getWithVersionId(key);

      const publishedAt = new Date().toISOString();

      const transactWriteItemList = [];

      // push Update operation for the template
      transactWriteItemList.push({
        Update: {
          ExpressionAttributeValues: {
            ":publishedAt": publishedAt,
            ":publishedVersion": publishedVersion,
          },
          Key: getTemplateDynamoKey(templateId),
          TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
          UpdateExpression:
            "set publishedAt = :publishedAt, publishedVersion = :publishedVersion",
        },
      });

      const hasSources =
        typeof latestDraft === "string"
          ? latestDraft.match(/("?)sources("?):\s?\[[^]*?\]/g)
          : null;

      // if the template contains sources then we need to create the source lookup items
      if (hasSources) {
        const oldSourceObjects = await fetchPublishedSourcesByTemplateId(
          templateId
        );
        const oldSources = getListOfStringSources(oldSourceObjects);

        // NOTE: if template has complex jsonnet then this will fail, since there is no test event data to render the template
        // the solution for these customers is to provide a deafult value to each `data()` or `profile()` call
        const { sources: newSources } = render(latestDraft);

        const trulyOldSources = oldSources.filter(
          (oldSource) => !newSources.includes(oldSource)
        );

        // push Delete operations for truly old sources
        trulyOldSources.map((source) => {
          transactWriteItemList.push({
            Delete: {
              Key: {
                pk: tenantId,
                sk: `source/${source}/template/${templateId}`,
              },
              TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
            },
          });
        });

        const trulyNewSources = (newSources ?? []).filter(
          (newSource) => !oldSources.includes(newSource)
        );

        // push Put operations for truly new sources
        trulyNewSources.map((source) => {
          transactWriteItemList.push({
            Put: {
              Item: {
                ...getTemplateSourceDynamoKey(source, templateId),
                tenantId,
                templateId,
                source,
                createdAt: publishedAt,
                type: "automation-source",
              },
              TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
            },
          });
        });
      }

      await transactWrite({
        TransactItems: transactWriteItemList,
      });

      return {
        publishedAt,
        publishedVersion,
      };
    },

    getByAlias: async (alias: string): Promise<IAutomationTemplate | null> => {
      const { Item } = await (getItem({
        Key: getAliasDynamoKey(alias),
        TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
      }) as Promise<{ Item: IAutomationTemplateAlias }>);

      if (!Item) {
        return null;
      }

      const { templateId } = Item;

      return get(templateId);
    },

    get,

    list: async (tenantId: string): Promise<IAutomationTemplate[]> => {
      const templateIds = await listIds(tenantId);

      return Promise.all(
        templateIds.map((templateId: string) => {
          return get(templateId);
        })
      );
    },

    delete: async (templateId: string): Promise<void> => {
      // Cannot delete a non-existent template
      const templateExists = await ifTemplateExists(templateId);
      if (!templateExists) {
        throw new Error("Template not found");
      }

      const transactWriteItemList = [];

      const aliasItem = await fetchAliasByTemplateId(templateId);
      if (aliasItem) {
        // delete alias item
        transactWriteItemList.push({
          Delete: {
            Key: getAliasDynamoKey(aliasItem.alias),
            TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
          },
        });

        // delete alias-mapping item
        transactWriteItemList.push({
          Delete: {
            Key: getAliasMappingDynamoKey(templateId),
            TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
          },
        });
      }

      // delete schedules
      const scheduleItems = await scheduler.get(templateId);
      if (scheduleItems) {
        transactWriteItemList.push(
          ...scheduleItems.map((item) => ({
            Delete: {
              Key: {
                pk: tenantId,
                sk: `${templateId}/${item.itemId}`,
              },
              TableName: process.env.AUTOMATION_SCHEDULER_TABLE,
            },
          }))
        );
      }

      // delete template
      transactWriteItemList.push({
        Delete: {
          Key: {
            pk: tenantId,
            sk: `template/${templateId}`,
          },
          TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
        },
      });

      const sourceObjects = await fetchPublishedSourcesByTemplateId(templateId);
      const sources = getListOfStringSources(sourceObjects);
      sources.map((source) => {
        // delete sources
        transactWriteItemList.push({
          Delete: {
            Key: {
              pk: tenantId,
              sk: `source/${source}/template/${templateId}`,
            },
            TableName: process.env.AUTOMATION_TEMPLATES_TABLE,
          },
        });
      });

      await transactWrite({
        TransactItems: transactWriteItemList,
      });
    },
  };
};
