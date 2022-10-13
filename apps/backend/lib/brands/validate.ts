import ajv from "~/lib/ajv";

export const schema = {
  additionalProperties: false,
  definitions: {
    brandColor: { type: "string" },
    brandColors: {
      additionalProperties: false,
      properties: {
        primary: { $ref: "#/definitions/brandColor" },
        secondary: { $ref: "#/definitions/brandColor" },
        tertiary: { $ref: "#/definitions/brandColor" },
      },
      type: "object",
    },
    settings: {
      additionalProperties: false,
      properties: {
        colors: { $ref: "#/definitions/brandColors" },
        email: { $ref: "#/definitions/settingsEmail" },
        inapp: { $ref: "#/definitions/settingsInApp" },
      },
      type: "object",
    },
    settingsInApp: {
      additionalProperties: false,
      properties: {
        borderRadius: { type: "string" },
        emptyState: {
          properties: {
            textColor: { type: "string" },
            text: { type: "string" },
          },
          type: "object",
        },
        widgetBackground: {
          properties: {
            topColor: { type: "string" },
            bottomColor: { type: "string" },
          },
          type: "object",
        },
        colors: {
          properties: {
            invertButtons: { type: "boolean" },
            invertHeader: { type: "boolean" },
          },
          type: "object",
        },
        disableMessageIcon: { type: "boolean" },
        disableCourierFooter: { type: "boolean" },
        fontFamily: { type: "string" },
        icons: {
          properties: { bell: { type: "string" }, message: { type: "string" } },
          type: "object",
        },
        placement: { type: "string" },
        preferences: {
          properties: {
            templateIds: {
              items: { type: "string" },
              type: "array",
            },
          },
          type: "object",
        },
        toast: {
          properties: {
            borderRadius: { type: "string" },
            timerAutoClose: { type: "number" },
          },
          type: "object",
        },
      },
      type: "object",
    },
    settingsEmail: {
      additionalProperties: false,
      properties: {
        head: {
          type: "object",
          properties: {
            inheritDefault: { type: "boolean" },
            content: { type: "string" },
          },
        },
        footer: { $ref: "#/definitions/settingsEmailFooter" },
        header: { $ref: "#/definitions/settingsEmailHeader" },
        templateOverride: {
          properties: {
            backgroundColor: { type: "string" },
            enabled: { type: "boolean" },
            footer: { type: "string" },
            head: { type: "string" },
            header: { type: "string" },
            width: { type: "string" },
          },
          type: "object",
        },
      },
      type: "object",
    },
    settingsEmailFooter: {
      additionalProperties: false,
      properties: {
        content: {
          additionalProperties: true,
          type: ["object", "null"],
        },
        inheritDefault: { type: "boolean" },
        markdown: {
          type: "string",
        },
        social: {
          additionalProperties: false,
          properties: {
            facebook: { $ref: "#/definitions/socialProvider" },
            instagram: { $ref: "#/definitions/socialProvider" },
            linkedin: { $ref: "#/definitions/socialProvider" },
            medium: { $ref: "#/definitions/socialProvider" },
            twitter: { $ref: "#/definitions/socialProvider" },
          },
          type: "object",
        },
      },
      type: "object",
    },
    settingsEmailHeader: {
      additionalProperties: false,
      properties: {
        barColor: { type: "string" },
        inheritDefault: { type: "boolean" },
        logo: {
          additionalProperties: false,
          properties: {
            href: { type: "string" },
            image: { type: "string" },
          },
          type: "object",
        },
      },
      type: "object",
    },
    snippet: {
      additionalProperties: false,
      properties: {
        format: {
          enum: ["handlebars"],
          type: "string",
        },
        name: { type: "string" },
        value: { type: "string" },
      },
      required: ["format", "name", "value"],
      type: "object",
    },
    snippets: {
      additionalProperties: false,
      properties: {
        items: {
          items: { $ref: "#/definitions/snippet" },
          type: "array",
          uniqueItemProperties: ["name"],
        },
      },
      type: "object",
    },
    socialProvider: {
      additionalProperties: false,
      properties: {
        url: { type: "string" },
      },
      type: "object",
    },
  },
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    settings: { $ref: "#/definitions/settings" },
    snippets: { $ref: "#/definitions/snippets" },
  },
  required: ["name", "settings"],
  type: "object",
};

export default ajv.compile(schema);
