import providers from "~/providers";
export const colorPattern = "^#(?:[0-9a-fA-F]{3}){1,2}$";
export const sizePattern = "([0-9]+)px";

export const noAdditionalProps = (
  field: string
): { not: boolean; errorMessage: string } => ({
  not: true,
  errorMessage: `Invalid Request. '\${0#}' is not a valid field of ${field}.`,
});

export const UTM = {
  type: "object",
  properties: {
    source: {
      type: "string",
      errorMessage: {
        type: "Invalid definition for property 'metadata.utm.source'. 'source' must be of type string.",
      },
    },
    medium: {
      type: "string",
      errorMessage: {
        type: "Invalid definition for property 'metadata.utm.medium'. 'medium' must be of type string.",
      },
    },
    campaign: {
      type: "string",
      errorMessage: {
        type: "Invalid definition for property 'metadata.utm.campaign'. 'campaign' must be of type string.",
      },
    },
    term: {
      type: "string",
      errorMessage: {
        type: "Invalid definition for property 'metadata.utm.term'. 'term' must be of type string.",
      },
    },
    content: {
      type: "string",
      errorMessage: {
        type: "Invalid definition for property 'metadata.utm.content'. 'content' must be of type string.",
      },
    },
  },
  additionalProperties: noAdditionalProps("metadata.utm"),
  errorMessage: {
    type: "Invalid definition for property 'metadata.utm'. 'utm' must be of type object.",
  },
};

export const messageProvidersSchema = (): {
  [key: string]: {
    type: "object";
    properties: {
      override: {
        type: "object";
      };
      if: {
        type: "string";
      };
      timeout: {
        type: "number";
      };
      metadata: {
        type: "object";
      };
    };
    additionalProperties: {
      not: boolean;
      errorMessage: string;
    };
    errorMessage: {
      properties: {
        override: string;
        if: string;
        timeout: string;
      };
    };
  };
} => {
  let providersProperties = {};
  for (const provider of Object.keys(providers)) {
    let obj = {};
    obj[provider] = {
      type: "object",
      properties: {
        override: {
          type: "object",
        },
        if: {
          type: "string",
        },
        timeout: {
          type: "number",
        },
        metadata: {
          type: "object",
          properties: {
            utm: UTM,
          },
          errorMessage: {
            type: `Invalid definition for property 'message.provider.[${provider}].metadata'. 'metadata' must be of type object.`,
          },
          additionalProperties: noAdditionalProps(
            `message.provider.[${provider}].metadata`
          ),
        },
      },
      additionalProperties: noAdditionalProps("providers"),
      errorMessage: {
        properties: {
          override: `Invalid definition for property 'message.providers.${provider}.override'. 'if' must be of type object.`,
          if: `Invalid definition for property 'message.providers.${provider}.if'. 'if' must be of type string.`,
          timeout: `Invalid definition for property 'message.providers.${provider}.timeout'. 'timeout' must be of type number.`,
        },
      },
    };
    Object.assign(providersProperties, obj);
  }

  return providersProperties;
};

export const routingChannelsSchema = () => {
  let routingChannels = ["sms", "direct_message", "push", "email"];
  return [...routingChannels, ...Object.keys(providers)];
};
