import upgrade from "~/lib/notifications/upgrade";
import {
  IChannel,
  ILegacyNotificationWire,
  INotificationWire,
  IStrategy,
} from "~/types.api";

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    batchGet: (params) => {
      return {
        promise: () => ({
          Responses: {
            [Object.keys(params.RequestItems)[0]]: [
              {
                creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
                tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
                created: 1572887936895,
                json: {
                  apiKey: "SuperSecretApiKey",
                  provider: "sendgrid",
                },
                objtype: "configuration",
                id: "configuration-1",
                title: "Sendgrid",
              },
              {
                creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
                tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
                created: 1572887936895,
                json: {
                  apiKey: "SuperSecretApiKey",
                  provider: "expo",
                },
                objtype: "configuration",
                id: "configuration-2",
                title: "Expo",
              },
              {
                creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
                tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
                created: 1572887936895,
                json: {
                  apiKey: "SuperSecretApiKey",
                  provider: "facebook-messenger",
                },
                objtype: "configuration",
                id: "configuration-3",
                title: "Facebook Messenger",
              },
              {
                creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
                tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
                created: 1572887936895,
                json: {
                  apiKey: "SuperSecretApiKey",
                  provider: "twilio",
                },
                objtype: "configuration",
                id: "configuration-4",
                title: "Twilio",
              },
            ],
          },
        }),
      };
    },
    get: (params) => {
      return {
        promise: () => {
          return params.Key.id === mockStrategy.id
            ? { Item: mockStrategy }
            : null;
        },
      };
    },
  };

  const mockS3Client = {
    createPresignedPost: jest.fn().mockReturnValue({ promise: () => null }),
    getObject: jest.fn().mockReturnValue({ promise: () => null }),
    putObject: jest.fn().mockReturnValue({ promise: () => null }),
  };

  const mockSQSClient = {
    getQueueUrl: jest.fn().mockReturnValue({ promise: () => "queue-url" }),
    sendMessage: jest.fn().mockReturnValue({ promise: () => null }),
  };

  return {
    config: {
      update: jest.fn(),
    },
    CognitoIdentityServiceProvider: jest.fn(),
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient),
    },
    S3: jest.fn(() => mockS3Client),
    SQS: jest.fn(() => mockSQSClient),
  };
});

const mockStrategy: IStrategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: ["configuration-1"],
    configurations: [
      "configuration-1",
      "configuration-2",
      "configuration-3",
      "configuration-4",
    ],
  },
  objtype: "strategy",
  id: "78bbe2ed-37ad-4780-8d1f-59b289f8f14b",
  title: "Notification Rules",
};

const mockNotification: ILegacyNotificationWire = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888002435,
  json: {
    strategyId: "78bbe2ed-37ad-4780-8d1f-59b289f8f14b",
    emailReplyTo: "reply-to@courier.com",
    emailSubject: "Email Subject",
    emailTemplateConfig: {
      footerLinks: null,
      footerTemplateName: "footer-template-name",
      footerText: null,
      headerLogoAlign: "left",
      headerLogoHref: "https://www.courier.com",
      headerLogoSrc: "logo.png",
      templateName: "line",
      topBarColor: "#58C87A",
    },
    isUsingTemplateOverride: true,
    templateOverride: "{{template_override}}",
    expoConfig: {
      subtitle: "Expo Subtitle",
      title: "Expo Title",
    },
    fbMessengerConfig: {
      tag: "#trycourier",
      fromAddress: "@trycourier",
    },
    blocks: [
      {
        type: "text",
        config: null,
        id: "37e68bc2-87c0-4b82-a4da-fb1b2444bdc9",
      },
    ],
    providers: {
      expo: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
      "facebook-messenger": {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
      sendgrid: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
      twilio: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
    },
  },
  objtype: "event",
  id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
  title: "Notification Test",
};

describe("Upgrade a notification", () => {
  let notification: INotificationWire;
  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(async () => {
    notification = await upgrade(mockNotification);
  });

  it("should set __legacy__strategy__id__", () => {
    expect(notification.json.__legacy__strategy__id__).toBe(mockStrategy.id);
  });

  it("should create a unique id for each channel", () => {
    function assertId(channel: IChannel) {
      expect(channel.id);
    }

    notification.json.channels.always.forEach(assertId);
    notification.json.channels.bestOf.forEach(assertId);
  });

  it("should create provider entry for each channel", () => {
    function assertProvider(key: string) {
      return (channel: IChannel, index: number) => {
        const provider = channel.providers[0];
        expect(provider.configurationId).toBe(mockStrategy.json[key][index]);
      };
    }
    notification.json.channels.always.forEach(assertProvider("always"));
    notification.json.channels.bestOf.forEach(assertProvider("configurations"));
  });

  it("should set key for provider", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy === "email:sendgrid"
    );
    expect(channel.providers[0].key).toBe("sendgrid");
  });

  it("should set taxonomy for an email channel", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy === "email:sendgrid"
    );
    expect(channel);
  });

  it("should set taxonomy for direct_message channel", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => (channel.taxonomy = "push:expo")
    );
    expect(channel);
  });

  it("should set taxonomy for sms channel", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => (channel.taxonomy = "direct_message:sms:twilio")
    );
    expect(channel);
  });

  it("should set the emailReplyTo value for email channels from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy.indexOf("email") === 0
    );
    expect(channel.config.email.emailReplyTo).toBe(
      mockNotification.json.emailReplyTo
    );
  });

  it("should set the emailSubject value for email channels from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy.indexOf("email") === 0
    );
    expect(channel.config.email.emailSubject).toBe(
      mockNotification.json.emailSubject
    );
  });

  it("should set the emailTemplateConfig value for email channels from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy.indexOf("email") === 0
    );
    expect(channel.config.email.emailTemplateConfig).toEqual(
      mockNotification.json.emailTemplateConfig
    );
  });

  it("should set the isUsingTemplateOverride value for email channels from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy.indexOf("email") === 0
    );
    expect(channel.config.email.isUsingTemplateOverride).toEqual(
      mockNotification.json.isUsingTemplateOverride
    );
  });

  it("should set the templateOverride value for email channels from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy.indexOf("email") === 0
    );
    expect(channel.config.email.templateOverride).toEqual(
      mockNotification.json.templateOverride
    );
  });

  it("should set the expoConfiguration configuration on the provider from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy === "push:expo"
    );
    const provider = channel.providers[0];
    expect(provider.config.expo).toEqual(mockNotification.json.expoConfig);
  });

  it("should set the facebook messenger configuration on the provider from the notification", () => {
    const channel = notification.json.channels.bestOf.find(
      (channel) => channel.taxonomy === "direct_message:facebook-messenger"
    );
    const provider = channel.providers[0];
    expect(provider.config.fbMessenger).toEqual(
      mockNotification.json.fbMessengerConfig
    );
  });

  it("should preserve the blocks property", () => {
    expect(notification.json.blocks).toEqual(mockNotification.json.blocks);
  });
});
