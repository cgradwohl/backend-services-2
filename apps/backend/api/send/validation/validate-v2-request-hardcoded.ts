import { get as getList, list as getLists } from "~/lib/lists";
import {
  Content,
  ContentMessage,
  ElementalContent,
  Message,
  MessageChannels,
  MessageData,
  MessageDelay,
  MessageMetadata,
  MessageProviderConfig,
  MessageProviders,
  MessageRecipient,
  MessageRouting,
  Recipient,
  Sequence,
  SequenceActions,
  TemplateMessage,
  Timeout,
} from "../types";

import { BadRequest } from "~/lib/http-errors";
import providers from "~/providers";
import { validateMessageBrand } from "./brand-validator";

const COLOR_WORKSPACES = [
  "8da7a9c6-f82b-46e7-ab55-b52d77ee8d6b",
  "8da7a9c6-f82b-46e7-ab55-b52d77ee8d6b/test",
];

// double-check any change in this logic is reciprocated to
// bulk processing validation if necessary
export async function validateV2RequestHardcoded(
  request: unknown,
  workspaceId: string
): Promise<void> {
  const message: Message = (request as any)?.message;
  const sequence = (request as any)?.sequence;

  if (!message && !sequence) {
    throw new BadRequest(
      "Invalid Request. Either 'message' or 'sequence' must be defined."
    );
  }

  if (message && sequence) {
    throw new BadRequest(
      "Invalid Request. The request cannot contain both a `sequence` and a `message` property."
    );
  }

  // TODO: CLEAN UP
  if (message) {
    validateMessage(message);

    await validateMessageTo(message.to, workspaceId);

    validateMessageContent((message as ContentMessage).content);

    validateMessageTemplate((message as TemplateMessage).template);

    validateMessageBrandId(message.brand_id);

    validateMessageBrand(message.brand);

    validateMessageChannels(message.channels);

    validateMessageProviders(message.providers);

    validateMessageRouting(message.routing);

    validateMessageData(message.data);

    validateMessageDelay(message.delay);

    validateMessageMetadata((message as ContentMessage).metadata, workspaceId);

    validateMessageTimeout(message.timeout);
  }

  if (sequence) {
    // TODO: SEQUENCE VALIDATION
    const invalidSequenceActions = (sequence as Sequence).some(
      (sequenceAction) => sequenceAction.action !== SequenceActions.send
    );

    if (invalidSequenceActions) {
      throw new BadRequest(
        "Invalid Request. Only the `send` Sequence Action is currently supported."
      );
    }
  }
}

function validateMessage(message: Message) {
  if (message !== undefined && typeof message !== "object") {
    throw new BadRequest("Invalid Request. 'message' must be of type object.");
  }

  if (
    (message as ContentMessage).content &&
    (message as TemplateMessage).template
  ) {
    throw new BadRequest(
      "Invalid Request. Either 'content' or 'template' may be defined, but not both."
    );
  }

  if (
    !(message as ContentMessage).content &&
    !(message as TemplateMessage).template
  ) {
    throw new BadRequest(
      "Invalid Request. Either 'content' or 'template' must be defined."
    );
  }

  if (!message.to) {
    throw new BadRequest("Invalid Request. The 'to' property is required.");
  }

  /**
   * if an invalid key is passed it prevents the request from being accepted.
   */
  const objectKeys = Object.keys(message);
  const validKeys = [
    "brand_id",
    "brand",
    "channels",
    "content",
    "data",
    "delay",
    "metadata",
    "providers",
    "routing",
    "template",
    "timeout",
    "to",
  ];
  const invalidKeyExists = objectKeys.some((key) => !validKeys.includes(key));

  if (invalidKeyExists) {
    const invalidKey = objectKeys
      .filter((key) => !validKeys.includes(key))
      .pop();

    throw new BadRequest(
      `Invalid Request. '${invalidKey}' is not a valid property of 'message'.`
    );
  }
}

async function validateMessageTo(to: MessageRecipient, workspaceId: string) {
  if (to !== undefined && typeof to !== "object") {
    throw new BadRequest(
      "Invalid Request. The 'to' property must be of type object or array."
    );
  }

  if (
    (to as Recipient)?.data !== undefined &&
    Array.isArray((to as Recipient).data)
  ) {
    throw new BadRequest(
      "Invalid definition for property 'message.to.data'. 'message.to.data' must be of type object."
    );
  }

  if ("list_id" in to) {
    try {
      const list = await getList(workspaceId, to.list_id);
      if (!list?.id) {
        throw new BadRequest(
          `Invalid Request. The list '${to.list_id}' is an archived list.`
        );
      }
    } catch (err) {
      throw new BadRequest(
        `Invalid Request. The list id '${to.list_id}', was not found.`
      );
    }
  }

  if ("list_pattern" in to) {
    try {
      const { items: lists } = await getLists(workspaceId, {
        pattern: to.list_pattern,
      });
      if (!lists?.length) {
        throw new BadRequest(
          `Invalid Request. The list pattern '${to.list_pattern}' is an archived list.`
        );
      }
    } catch (err) {
      throw new BadRequest(
        `Invalid Request. The list pattern '${to.list_pattern}', was not found.`
      );
    }
  }

  if ("audience_id" in to && !to.audience_id) {
    throw new BadRequest(`Invalid Request. The audience must be defined.`);
  }

  if ("audience_id" in to && typeof to.audience_id !== "string") {
    throw new BadRequest(`Invalid Request. The audience must be defined.`);
  }

  // recursive base case
  if (!to) {
    return;
  }

  // recursive call
  if (Array.isArray(to)) {
    // use Promise.all to fail fast
    await Promise.all(
      to.map((profile) => validateMessageTo(profile, workspaceId))
    );
  }
}

export function validateMessageContent(content: Content) {
  if (content !== undefined && typeof content !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'message.content'. 'content' must be of type object."
    );
  }

  if (!content) {
    return;
  }
  const objectKeys = Object.keys(content);

  if (
    content &&
    !objectKeys.some((key) => ["title", "body", "elements"].includes(key))
  ) {
    throw new BadRequest(
      "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'"
    );
  }

  /**
   * if an invalid key is passed it prevents the request from being accepted.
   */
  const validKeys = ["version", "elements", "title", "body"];
  const invalidKeyExists = objectKeys.some((key) => !validKeys.includes(key));

  if (invalidKeyExists) {
    const invalidKey = objectKeys
      .filter((key) => !validKeys.includes(key))
      .pop();

    throw new BadRequest(
      `Invalid Request. '${invalidKey}' is not a valid property of 'message.content'.`
    );
  }

  if (!("elements" in content) && !("body" in content)) {
    throw new BadRequest(
      "Invalid Request. 'message.content' must contain either 'elements' or 'body'."
    );
  }

  if (
    content &&
    (content as ElementalContent).elements?.length &&
    !(content as ElementalContent).version
  ) {
    throw new BadRequest(
      "Invalid Request. 'message.content' must contain a 'version' property when using `content.elements`."
    );
  }
}

export function validateMessageTemplate(template: string) {
  if (template !== undefined && typeof template !== "string") {
    throw new BadRequest("Invalid Request. 'template' must be of type string.");
  }
}

export function validateMessageChannels(channels: MessageChannels) {
  if (channels !== undefined && typeof channels !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'channels'. 'channels' must be of type object."
    );
  }

  if (!channels) {
    return;
  }

  const validChannelsKeys = ["email", "push", "sms", "direct_message"];
  const invalidKeys = Object.keys(channels).filter(
    (key) => !validChannelsKeys.includes(key)
  );

  if (invalidKeys.length) {
    throw new BadRequest(
      `Invalid Request. '${invalidKeys.join(", ")}' ${
        invalidKeys.length > 1
          ? "are not valid properties"
          : "is not a valid property"
      } of 'message.channels'.`
    );
  }

  for (const key in channels) {
    /**
     * if an invalid key is passed it prevents the request from being accepted.
     */
    const validChannelsConfigKeys = [
      "brand_id",
      "providers",
      "routing_method",
      "if",
      "timeout",
      "override",
      "metadata",
    ];
    const invalidKeys = Object.keys(channels[key]).filter(
      (key) => !validChannelsConfigKeys.includes(key)
    );

    if (invalidKeys.length) {
      throw new BadRequest(
        `Invalid Request. '${invalidKeys.join(", ")}' ${
          invalidKeys.length > 1
            ? "are not valid properties"
            : "is not a valid property"
        } of 'message.channels.${key}'.`
      );
    }

    if (channels[key]?.metadata?.utm) {
      validateUtm(channels[key]?.metadata);
    }
  }
}

export function validateMessageBrandId(brand_id: string) {
  if (brand_id !== undefined && typeof brand_id !== "string") {
    throw new BadRequest(
      "Invalid definition for property 'brand_id'. 'brand_id' must be of type string."
    );
  }
}

export function validateMessageProviders(messageProviders: MessageProviders) {
  if (messageProviders !== undefined && typeof messageProviders !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'providers'. 'providers' must be of type object."
    );
  }

  if (!messageProviders) {
    return;
  }

  const validProviderKeys = new Set(Object.keys(providers));

  for (const messageProvider of Object.keys(messageProviders)) {
    if (!validProviderKeys.has(messageProvider)) {
      throw new BadRequest(
        `Invalid Request. '${messageProvider}' is not a valid provider key.`
      );
    }
  }

  for (const providerKey of Object.keys(messageProviders)) {
    const providerConfig = messageProviders[providerKey];
    validateMessageProvider(providerConfig, providerKey);
  }
}

export function validateMessageProvider(
  providerConfig: MessageProviderConfig,
  providerKey: string
) {
  const validFields = new Set(["override", "if", "timeout", "metadata"]);

  for (const field of Object.keys(providerConfig)) {
    if (!validFields.has(field)) {
      throw new BadRequest(
        `Invalid Request. '${field}' is not a valid field of providers.`
      );
    }

    const expectedType = {
      override: "object",
      if: "string",
      timeout: "number",
      metadata: "object",
    }[field];

    if (typeof providerConfig[field] !== expectedType) {
      throw new BadRequest(
        `Invalid definition for property 'message.providers.${providerKey}.${field}'. '${field}' must be of type ${expectedType}.`
      );
    }
  }

  if (providerConfig?.metadata?.utm) {
    validateUtm(providerConfig.metadata);
  }
}

export function validateMessageRouting(routing: MessageRouting) {
  if (routing !== undefined && typeof routing !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'routing'. 'routing' must be of type object."
    );
  }

  if (!routing) {
    return;
  }

  if (!routing.channels) {
    throw new BadRequest(
      "Invalid Request. 'channels' is a required property of 'message.routing'."
    );
  }

  if (!routing.method) {
    throw new BadRequest(
      "Invalid Request. 'method' is a required property of 'message.routing'."
    );
  }

  if (typeof routing.method !== "string") {
    throw new BadRequest(
      "Invalid Request. 'routing.method' must be of type string. Either 'all' or 'single' are valid string values for 'routing.method'."
    );
  }

  if (!["all", "single"].includes(routing.method)) {
    throw new BadRequest(
      `Invalid Request. ${routing.method} is not a valid 'routing.method' value. Either 'all' or 'single' are valid string values for 'routing.method'.`
    );
  }

  /**
   * if an invalid key is passed it prevents the request from being accepted.
   */
  const validKeys = ["method", "channels"];
  const invalidKeyExists = Object.keys(routing).some(
    (key) => !validKeys.includes(key)
  );

  if (invalidKeyExists) {
    const invalidKey = Object.keys(routing)
      .filter((key) => !validKeys.includes(key))
      .pop();

    throw new BadRequest(
      `Invalid Request. '${invalidKey}' is not a valid property of 'message.routing'.`
    );
  }
}

export function validateMessageData(data: MessageData) {
  if (data !== undefined && typeof data !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'data'. 'data' must be of type object."
    );
  }

  if (data !== undefined && Array.isArray(data)) {
    throw new BadRequest(
      "Invalid definition for property 'data'. 'data' must be of type object."
    );
  }
}

export function validateMessageDelay(delay: MessageDelay) {
  if (!delay) {
    return;
  }

  if (delay !== undefined && typeof delay !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'delay'. 'delay' must be of type object."
    );
  }

  if (delay !== undefined && Array.isArray(delay)) {
    throw new BadRequest(
      "Invalid definition for property 'delay'. 'delay' must be of type object."
    );
  }

  const delayKeys = Object.keys(delay);
  const validDelayKeys = ["duration"];

  for (const key of delayKeys) {
    if (!validDelayKeys.includes(key)) {
      throw new BadRequest(
        `Invalid Request. '${key}' is not a valid property of 'message.delay'.`
      );
    }
  }

  if (delay.duration !== undefined && typeof delay.duration !== "number") {
    throw new BadRequest(
      "Invalid definition for property 'delay.duration'. 'duration' must be of type number."
    );
  }
}

export function validateMessageMetadata(
  metadata: MessageMetadata,
  workspaceId: string
) {
  if (metadata === undefined) {
    return;
  }

  const metadataKeys = Object.keys(metadata);
  const validMetadataKeys = ["event", "tags", "utm", "trace_id"];

  for (const key of metadataKeys) {
    if (!validMetadataKeys.includes(key)) {
      throw new BadRequest(
        `Invalid Request. '${key}' is not a valid property of 'message.metadata'.`
      );
    }
  }

  if (metadata.event !== undefined && typeof metadata.event !== "string") {
    throw new BadRequest(
      "Invalid definition for property 'metadata.event'. 'event' must be of type string."
    );
  }

  if (
    metadata.trace_id !== undefined &&
    typeof metadata.trace_id !== "string"
  ) {
    throw new BadRequest(
      "Invalid definition for property 'metadata.trace_id'. 'trace_id' must be of type string."
    );
  }

  if (metadata?.trace_id?.length > 36) {
    throw new BadRequest(
      "Invalid definition for property 'metadata.trace_id'. Trace ID cannot be longer than 36 characters."
    );
  }

  const tags = metadata?.tags ?? [];
  if (tags.length > 9) {
    throw new BadRequest(
      "Invalid definition for property 'metadata.tags'. Cannot specify more than 9 tags"
    );
  }

  for (const tag of tags) {
    if (COLOR_WORKSPACES.includes(workspaceId)) {
      if (tag?.length > 256) {
        throw new BadRequest(
          "Invalid definition for property 'metadata.tags'. Tags cannot be longer than 256 characters."
        );
      }
    } else {
      if (tag?.length > 30) {
        throw new BadRequest(
          "Invalid definition for property 'metadata.tags'. Tags cannot be longer than 30 characters."
        );
      }
    }
  }

  if (metadata.utm !== undefined && typeof metadata.utm !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'metadata.utm'. 'utm' must be of type object."
    );
  }

  validateUtm(metadata);
}

function validateUtm(metadata: MessageMetadata): void {
  if (metadata?.utm) {
    const validKeys = ["source", "medium", "campaign", "term", "content"];
    const { utm } = metadata;

    for (const key in utm) {
      if (!validKeys.includes(key)) {
        throw new BadRequest(
          `Invalid Request. '${key}' is not a valid property of 'metadata.utm'.`
        );
      }

      if (typeof utm[key] !== "string") {
        throw new BadRequest(
          `Invalid definition for property 'metadata.utm.${key}'. '${key}' must be of type string.`
        );
      }
    }
  }
}

export function validateMessageTimeout(timeout: Timeout) {
  if (timeout === undefined) {
    return;
  }

  if (typeof timeout !== "object") {
    throw new BadRequest(
      "Invalid definition for property 'message.timeout'. 'timeout' must be of type object."
    );
  }

  if (timeout.message) {
    if (typeof timeout.message !== "number") {
      throw new BadRequest(
        "Invalid definition for property 'timeout.message'. 'message' must be of type number."
      );
    }
    if (isTimeoutOutOfBounds(timeout.message)) {
      throw new BadRequest(
        "Invalid definition for property 'timeout.message'. 'message' must be between 0 and 259200000"
      );
    }
  }

  if ("channel" in timeout) {
    validateTimeoutChannel(timeout.channel);
  }

  if ("provider" in timeout) {
    validateTimeoutProvider(timeout.provider);
  }
}

function validateTimeoutChannel(channel: unknown) {
  if (typeof channel === "object") {
    Object.entries(channel).forEach(([, timeout]) => {
      if (typeof timeout !== "number") {
        throw new BadRequest(
          `Invalid definition for property 'message.timeout.channel.${channel}'. 'timeout.channel.${channel}' must be of type number.`
        );
      }

      if (isTimeoutOutOfBounds(timeout)) {
        throw new BadRequest(
          `Invalid definition for property 'timeout.channel.${channel}'. 'channel.${channel}' must be between 0 and 259200000`
        );
      }
    });
    return;
  }

  if (typeof channel === "number" && isTimeoutOutOfBounds(channel)) {
    throw new BadRequest(
      `Invalid definition for property 'timeout.provider.${channel}'. 'provider.${channel}' must be between 0 and 259200000`
    );
  }

  if (typeof channel === "number") {
    return;
  }

  throw new BadRequest(
    "Invalid definition for property 'message.timeout.channel'. 'timeout.channel' must be of type object or number."
  );
}

function validateTimeoutProvider(provider: unknown) {
  if (typeof provider === "object") {
    Object.entries(provider).forEach(([, timeout]) => {
      if (typeof timeout !== "number") {
        throw new BadRequest(
          `Invalid definition for property 'message.timeout.provider.${provider}'. 'timeout.provider.${provider}' must be of type number.`
        );
      }

      if (isTimeoutOutOfBounds(timeout)) {
        throw new BadRequest(
          `Invalid definition for property 'timeout.provider.${provider}'. 'provider.${provider}' must be between 0 and 259200000`
        );
      }
    });
    return;
  }

  if (typeof provider === "number" && isTimeoutOutOfBounds(provider)) {
    throw new BadRequest(
      `Invalid definition for property 'timeout.provider.${provider}'. 'provider.${provider}' must be between 0 and 259200000`
    );
  }

  if (typeof provider === "number") {
    return;
  }

  throw new BadRequest(
    "Invalid definition for property 'message.timeout.provider'. 'timeout.provider' must be of type object or number."
  );
}

function isTimeoutOutOfBounds(value: number): boolean {
  return value > 259200000 || value < 0;
}
