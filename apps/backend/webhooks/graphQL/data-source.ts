import { v4 as uuid } from "uuid";
import uuidAPIKey from "uuid-apikey";
import { decode } from "~/lib/base64";
import { id as createId } from "~/lib/dynamo";
import dynamoObjectService from "~/lib/dynamo/object-service";
import { IDynamoDbObjectService } from "~/lib/dynamo/object-service/types";
import { NotFound } from "~/lib/http-errors";
import logger from "~/lib/logger";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import { CourierObject } from "~/types.api";
import { IWebhook, IWebhookJson } from "~/webhooks/types";

import DataSource from "../../studio/graphql/lib/data-source";

type WebhookInput = Omit<IWebhook, "id"> & { name?: string; webhookId: string };
export default class WebhooksDataSource extends DataSource {
  private service: IDynamoDbObjectService<IWebhookJson>;

  constructor() {
    super();

    this.service = dynamoObjectService<IWebhookJson>(this.objtype);
  }

  get objtype(): string {
    return "webhook";
  }

  public async get(webhookId: string) {
    try {
      const webhook = await this.service.get({
        id: webhookId,
        tenantId: this.getEnvScopedTenantId(),
      });

      return this.map(webhook);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
    }
  }

  public async list(after?: string, first?: number) {
    const { lastEvaluatedKey, objects: webhooks } = await this.service.list({
      ExpressionAttributeValues: {
        ":webhook": "settings/webhook",
      },
      FilterExpression: "begins_with(id, :webhook)",
      Limit: first,
      exclusiveStartKey: after ? { id: decode(after) } : undefined,
      ignoreArchived: true,
      tenantId: this.getEnvScopedTenantId(),
    });

    if (!webhooks?.length) {
      return {
        items: [],
      };
    }

    return {
      items: webhooks.map(this.map),
      next: lastEvaluatedKey,
    };
  }

  public async save(webhook: WebhookInput) {
    const existingWebhook = webhook?.webhookId
      ? await this.service.get({
          id: webhook.webhookId,
          tenantId: this.getEnvScopedTenantId(),
        })
      : undefined;
    const id = existingWebhook?.id ?? `settings/webhook/${createId()}`;
    const secret =
      existingWebhook?.json.secret ??
      `whsec_${uuidAPIKey.toAPIKey(uuid(), { noDashes: true })}`;
    await this.service.replace(
      {
        id,
        tenantId: this.getEnvScopedTenantId(),
        userId: this.context.userId,
      },
      {
        json: {
          description: webhook.description,
          events: ["*"],
          secret,
          url: webhook.url,
        },
        title: webhook.name ?? webhook.url,
      },
      { serialize: false }
    );

    return {
      archived: existingWebhook?.archived ?? false,
      description: webhook.description,
      name: webhook.name,
      url: webhook.url,
      webhookId: id,
    };
  }

  public async disable(webhookId: string) {
    await this.service.archive({
      id: webhookId,
      tenantId: this.getEnvScopedTenantId(),
      userId: this.context.userId,
    });

    return {
      archived: true,
      webhookId,
    };
  }

  public async enable(webhookId: string) {
    await this.service.restore({
      id: webhookId,
      tenantId: this.getEnvScopedTenantId(),
      userId: this.context.userId,
    });

    return {
      archived: false,
      webhookId,
    };
  }

  public async retrieveSecret(webhookId: string) {
    const webhook = await this.service.get({
      id: webhookId,
      tenantId: this.getEnvScopedTenantId(),
    });
    return {
      webhookId,
      webhookSecret: webhook.json.secret,
    };
  }

  public async rotateSecret(webhookId: string) {
    const webhook = await this.service.get({
      id: webhookId,
      tenantId: this.getEnvScopedTenantId(),
    });
    const secret = `whsec_${uuidAPIKey.toAPIKey(uuid(), { noDashes: true })}`;
    await this.service.replace(
      {
        id: webhookId,
        tenantId: this.getEnvScopedTenantId(),
        userId: this.context.userId,
      },
      {
        json: {
          ...webhook.json,
          secret,
        },
      },
      { serialize: false }
    );

    return {
      webhookId,
      webhookSecret: secret,
    };
  }

  protected map(webhook: CourierObject<IWebhookJson>) {
    if (!webhook) {
      return null;
    }

    const { archived, created, id, json, title, updated } = webhook;

    logger.debug(`WebhooksDataSource.map: ${JSON.stringify(json)}`);

    return {
      archived: Boolean(archived),
      created,
      description: json.description,
      events: json.events,
      id: createEncodedId(id, "webhook"),
      name: title,
      secret: json?.secret,
      updated,
      url: json.url,
      webhookId: id,
    };
  }
}
