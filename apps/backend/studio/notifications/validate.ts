import { ErrorObject } from "ajv";
import ajv, { extractErrors as baseExtractErrors } from "~/lib/ajv";

export const notificationSchema = {
  additionalProperties: false,
  definitions: {
    beamerConfig: {
      properties: {
        category: { type: "string" },
        title: { type: "string" },
      },
      type: "object",
    },
    block: {
      additionalProperties: false,
      properties: {
        alias: { type: "string" },
        updated: { type: "number" },
        config: { type: "string" },
        context: { type: "string" },
        id: { type: "string" },
        type: {
          enum: [
            "action",
            "column",
            "divider",
            "image",
            "line",
            "list",
            "markdown",
            "quote",
            "template",
            "text",
            "jsonnet",
          ],
          type: "string",
        },
      },
      required: ["config", "id", "type"],
      type: "object",
    },
    channel: {
      additionalProperties: false,
      properties: {
        slots: {
          type: "object",
          properties: {
            title: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        blockIds: {
          items: { type: "string" },
          type: "array",
        },
        conditional: { $ref: "#/definitions/conditionalConfig" },
        config: {
          additionalProperties: false,
          properties: {
            email: { $ref: "#/definitions/emailConfig" },
            push: { $ref: "#/definitions/pushConfig" },
          },
          type: "object",
        },
        disabled: {
          type: "boolean",
        },
        id: { type: "string" },
        label: { type: "string" },
        providers: {
          items: { $ref: "#/definitions/channelProvider" },
          type: "array",
        },
        taxonomy: { type: "string" },
      },
      required: ["blockIds", "id", "providers", "taxonomy"],
      type: "object",
    },
    channelProvider: {
      additionalProperties: false,
      properties: {
        conditional: { $ref: "#/definitions/conditionalConfig" },
        config: {
          additionalProperties: false,
          properties: {
            beamer: {
              $ref: "#/definitions/beamerConfig",
            },
            chatApi: {
              $ref: "#/definitions/chatApiConfig",
            },
            discord: {
              $ref: "#/definitions/discordConfig",
            },
            expo: {
              $ref: "#/definitions/expoConfig",
            },
            fbMessenger: {
              $ref: "#/definitions/facebookMessengerConfig",
            },
            firebaseFcm: {
              $ref: "#/definitions/firebaseFcmConfig",
            },
            opsgenie: {
              $ref: "#/definitions/opsgenieConfig",
            },
            nowpush: {
              $ref: "#/definitions/nowpushConfig",
            },
            pushbullet: {
              $ref: "#/definitions/pushbulletConfig",
            },
            slack: {
              $ref: "#/definitions/slackConfig",
            },
            splunkOnCall: {
              $ref: "#/definitions/splunkOnCallConfig",
            },
            streamChat: {
              $ref: "#/definitions/streamChatConfig",
            },
            apn: {
              $ref: "#/definitions/apnConfig",
            },
          },
          type: "object",
        },
        configurationId: { type: "string" },
        key: { type: "string" },
      },
      required: ["key"],
      type: "object",
    },
    chatApiConfig: {
      properties: {
        quotedMsgId: { type: "string" },
        mentionedPhones: { type: "string" },
      },
      type: "object",
    },
    checkConfig: {
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        id: { type: "string" },
        resolutionKey: { type: "string" },
        type: { type: "string" },
      },
      required: ["enabled", "id", "type"],
      type: "object",
    },
    conditionalConfig: {
      properties: {
        filters: {
          // Array of object - value may be optional
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              operator: { type: "string" },
              property: { type: "string" },
              source: { type: "string" },
              value: { type: "string" },
            },
          },
        },
        logicalOperator: { type: "string" },
      },
      required: ["logicalOperator", "filters"],
      type: "object",
    },
    discordConfig: {
      additionalProperties: false,
      properties: {
        messageId: { type: "string" },
        replyToMessageId: { type: "string" },
      },
      type: "object",
    },
    emailConfig: {
      additionalProperties: false,
      properties: {
        emailBCC: { type: "string" },
        emailCC: { type: "string" },
        emailFrom: { type: "string" },
        emailReplyTo: { type: "string" },
        emailSubject: { type: "string" },
        emailTemplateConfig: {
          additionalProperties: false,
          properties: {
            footerLinks: { type: "object" },
            footerTemplateName: { type: "string" },
            footerText: { type: "string" },
            headerLogoAlign: { type: "string" },
            headerLogoHref: { type: "string" },
            headerLogoSrc: { type: "string" },
            templateName: { type: "string" },
            topBarColor: { type: "string" },
          },
          type: "object",
        },
        isUsingTemplateOverride: { type: "boolean" },
        payloadOverrideTemplate: { type: "string" },
        renderPlainText: { type: "boolean" },
        templateOverride: { type: "string" },
      },
      type: "object",
    },
    pushConfig: {
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        icon: { type: "string" },
        clickAction: { type: "string" },
      },
      type: "object",
    },
    expoConfig: {
      properties: {
        subtitle: { type: "string" },
        title: { type: "string" },
      },
      type: "object",
    },
    facebookMessengerConfig: {
      properties: {
        fromAddress: { type: "string" },
        tag: { type: "string" },
      },
      type: "object",
    },
    firebaseFcmConfig: {
      properties: {
        title: { type: "string" },
      },
      type: "object",
    },
    notificationConfig: {
      properties: {
        type: {
          enum: ["REQUIRED", "OPT_IN", "OPT_OUT"],
          type: "string",
        },
      },
      required: ["type"],
      type: "object",
    },
    opsgenieConfig: {
      additionalProperties: false,
      properties: {
        message: { type: "string" },
      },
      type: "object",
    },
    nowpushConfig: {
      type: "object",
      additionalProperties: false,
      properties: {
        device_type: { type: "string" },
        message_type: { type: "string" },
        note: { type: "string" },
        url: { type: "string" },
      },
    },
    pushbulletConfig: {
      additionalProperties: false,
      properties: {
        title: { type: "string" },
      },
      type: "object",
    },
    slackConfig: {
      additionalProperties: false,
      properties: {
        tsPath: { type: "string" },
        presenceChecking: { type: "boolean" },
      },
      type: "object",
    },
    splunkOnCallConfig: {
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
      },
      type: "object",
    },
    streamChatConfig: {
      additionalProperties: false,
      properties: {
        channelId: { type: "string" },
        channelType: { type: "string" },
        messageId: { type: "string" },
      },
      type: "object",
    },
    apnConfig: {
      additionalProperties: false,
      properties: {
        topic: { type: "string" },
      },
      type: "object",
    },
    testEvent: {
      additionalProperties: false,
      properties: {
        data: { type: "object", additionalProperties: true },
        id: { type: "string" },
        label: { type: "string" },
        override: { type: "object", additionalProperties: true },
        profile: { type: "object", additionalProperties: true },
        locale: { type: "string" },
      },
      required: ["id"],
      type: "object",
    },
  },
  properties: {
    archived: { type: "boolean" },
    id: { type: "string" },
    json: {
      additionalProperties: false,
      properties: {
        __legacy__strategy__id__: {
          type: "string",
        },
        blocks: {
          items: { $ref: "#/definitions/block" },
          type: "array",
        },
        brandConfig: {
          additionalProperties: false,
          properties: {
            defaultBrandId: { type: "string" },
            enabled: { type: "boolean" },
          },
          required: ["enabled"],
          type: "object",
        },
        categoryId: { type: "string" },
        channels: {
          additionalProperties: false,
          properties: {
            always: {
              items: { $ref: "#/definitions/channel" },
              type: "array",
            },
            bestOf: {
              items: { $ref: "#/definitions/channel" },
              type: "array",
            },
          },
          type: "object",
        },
        checkConfigs: {
          items: { $ref: "#/definitions/checkConfig" },
          type: "array",
        },
        conditional: { $ref: "#/definitions/conditionalConfig" },
        config: { $ref: "#/definitions/notificationConfig" },
        localesConfig: {
          additionalProperties: false,
          properties: {
            enabled: {
              type: "boolean",
            },
          },
          type: "object",
        },
        draftId: { type: "string" },
        notificationId: { type: "string" },
        preferenceTemplateId: { type: "string" },
        tagIds: {
          items: { type: "string" },
          type: "array",
        },
        testEvents: {
          items: { $ref: "#/definitions/testEvent" },
          type: "array",
        },
      },
      required: ["blocks", "channels"],
      type: "object",
    },
    objtype: {
      enum: ["event", "notification-draft"],
      type: "string",
    },
    sourceTimestamp: { type: "number" },
    title: { type: "string" },
  },
  required: ["json", "objtype", "title"],
  type: "object",
};

export const notificationValidator = {
  validate: ajv.compile(notificationSchema),
  extractErrors(data: any, errors: ErrorObject[]) {
    return baseExtractErrors(notificationSchema, data, errors);
  },
};

export const testNotificationSchema = {
  additionalProperties: false,
  properties: {
    brandId: { type: "string" },
    channelId: { type: "string" },
    courier: {
      additionalProperties: false,
      properties: {
        environment: { type: "string" },
        scope: { type: "string" },
      },
      type: "object",
    },
    data: {
      additionalProperties: true,
      type: "object",
    },
    draftId: { type: "string" },
    emailBCC: { type: "string" },
    emailCC: { type: "string" },
    emailFrom: { type: "string" },
    emailReplyTo: { type: "string" },
    locale: { type: "string" },
    override: {
      additionalProperties: true,
      type: "object",
    },
    previewRender: { type: "boolean" },
    profile: {
      additionalProperties: true,
      type: "object",
    },
    title: { type: "string" },
    users: {
      items: { type: "string" },
      type: "array",
    },
  },
  required: ["channelId"],
  type: "object",
};

export const testNotificationValidator = {
  validate: ajv.compile(testNotificationSchema),
  extractErrors(data: any, errors: ErrorObject[]) {
    return baseExtractErrors(testNotificationSchema, data, errors);
  },
};
