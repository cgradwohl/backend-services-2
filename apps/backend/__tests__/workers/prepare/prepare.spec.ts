import { DynamoDB, S3, SQS } from "aws-sdk";
import * as eventLogs from "~/lib/dynamo/event-logs";
import mockRetryMessage from "~/lib/dynamo/retry-message-v2";
import {
  hasDrafts as mockHasDrafts,
  list as mockList,
} from "~/lib/notification-service/draft";
import getLatestDraft from "~/workers/lib/get-latest-draft";

import { S3Message } from "~/types.internal";
import { handleRecord as handle } from "~/workers/prepare";
import fixtures from "./__fixtures__";

// set a hard coded date time for testing purposes
jest.spyOn(Date.prototype, "getTime").mockImplementation(() => 1482363367071);

jest.mock("~/lib/sqs/create-event-handler");

jest.mock("~/lib/get-launch-darkly-flag", () => {
  return {
    getFeatureTenantTemplateVariation: () => ({
      brand: 0,
      configurations: 0,
      drafts: 0,
      notification: 0,
    }),

    getFeatureTenantVariation: () => false,
  };
});

jest.mock("~/lib/notification-service/draft", () => {
  const list = jest.fn();
  list.mockReturnValue({ objects: [{}, {}] });

  const getLatestDraft = jest.fn();
  getLatestDraft.mockImplementation((params) => {
    let response;
    Object.keys(fixtures).forEach((fixture) => {
      Object.keys(fixtures[fixture]).forEach((key) => {
        const data = fixtures[fixture][key];

        if (data.id === params.id) {
          response = data;
        }
      });
    });

    return response;
  });

  return {
    getLatestDraft,
    hasDrafts: jest.fn().mockReturnValue(true),
    list,
  };
});

// required to stub out sentry integration
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/workers/lib/get-latest-draft", () => {
  return jest.fn();
});

jest.mock("~/lib/dynamo/event-logs", () => {
  return {
    createErrorEvent: jest.fn(),
    createFilteredEvent: jest.fn(),
    createMappedEvent: jest.fn(),
    createProfileLoadedEvent: jest.fn(),
    createUnmappedEvent: jest.fn(),
    createUnroutableEvent: jest.fn(),
  };
});

jest.mock("~/lib/dynamo/retry-message-v2");
jest.mock("~/lib/get-environment-variable");

// required for consistent ids in event logs
jest.mock("uuid", () => {
  let value = 1;
  return { v4: () => value++ };
});

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    batchGet: jest.fn().mockImplementation((params) => {
      const { configurations } = fixtures;
      const table = Object.keys(params.RequestItems)[0];

      const results = params.RequestItems[table].Keys.map((key) => {
        const configuration = configurations.find(
          (config) => config.id === key.id
        );
        return configuration;
      });

      return {
        promise: () => ({
          Responses: {
            [table]: results,
          },
        }),
      };
    }),
    get: jest.fn().mockImplementation((params) => {
      const createResponse = (item) => ({
        promise: () => ({ Item: item }),
      });

      let response;
      Object.keys(fixtures).forEach((fixture) => {
        Object.keys(fixtures[fixture]).forEach((key) => {
          const data = fixtures[fixture][key];

          if (data.id === params.Key.id) {
            response = data;
          }
        });
      });
      return createResponse(response);
    }),
  };

  const mockS3Client = {
    createPresignedPost: jest.fn(),
    getObject: jest.fn().mockReturnValue({
      promise: () => ({
        catch: () => null,
      }),
    }),
    putObject: jest.fn().mockReturnValue({
      promise: () => ({
        catch: () => null,
      }),
    }),
  };

  const mockSQSClient = {
    getQueueUrl: jest.fn().mockReturnValue({ promise: () => "queue-url" }),
    sendMessage: jest.fn().mockReturnValue({ promise: () => null }),
  };

  // its kinda stupid we have to do this
  // if you trace it thru you will find out that
  // the reason is when we handle errors it references
  // err instanceof MessageErrors.MessageNotFoundError
  return {
    APIGateway: jest.fn(),
    CognitoIdentityServiceProvider: jest.fn(),
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient),
    },
    EventBridge: jest.fn(),
    S3: jest.fn(() => mockS3Client),
    SQS: jest.fn(() => mockSQSClient),
    config: {
      update: jest.fn(),
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("notification not found", () => {
  beforeEach(async () => {
    await handle(fixtures.notFoundNotification.event.Records[0]);
  });

  it("create an unmapped event log entry", () => {
    expect(
      (eventLogs.createUnmappedEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-5e0f64f5-01f25aca9d89333c7eeaee16",
      { eventId: "" },
    ]);
  });
});

describe("legacy notification", () => {
  beforeEach(async () => {
    await handle(fixtures.legacyNotification.event.Records[0]);
  });

  it("should save inbound input to s3", () => {
    expect((S3 as any as jest.Mock)().putObject.mock.calls[0]).toMatchObject([
      {
        Body: JSON.stringify({
          _meta: {
            messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
            tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
          },
          brand: undefined,
          courier: {
            environment: "production",
            scope: "published",
          },
          data: {},
          event: "9JXJ5YX93G42Y8MX6C7BH7XPHEFN",
          profile: {},
          recipient: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
          scope: "published/production",
        }),
        Key: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-5e0f64f5-01f25aca9d89333c7eeaee16.input.json",
      },
    ]);
  });

  describe("saving an outbound s3 file for route processing", () => {
    let body: S3Message;

    beforeEach(() => {
      body = JSON.parse(
        (S3 as any as jest.Mock)().putObject.mock.calls[1][0].Body
      );
    });

    it("should include configurations", () => {
      expect(body.configurations).toMatchObject([
        fixtures.configurations[1], // sendgrid
        fixtures.configurations[2], // twilio
      ]);
    });

    it("should include the notification", () => {
      expect(body.notification).toMatchObject({
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
        json: {
          blocks: [],
          channels: {
            always: [],
            bestOf: [
              {
                config: {
                  email: {
                    emailSubject: "Email Subject",
                    emailTemplateConfig: {
                      headerLogoAlign: "left",
                      templateName: "line",
                      topBarColor: "#58C87A",
                    },
                  },
                },
                providers: [
                  {
                    config: {},
                    configurationId: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
                  },
                ],
                taxonomy: "direct_message:sms:twilio",
              },
              {
                config: {
                  email: {
                    emailSubject: "Email Subject",
                    emailTemplateConfig: {
                      headerLogoAlign: "left",
                      templateName: "line",
                      topBarColor: "#58C87A",
                    },
                  },
                },
                providers: [
                  {
                    config: {},
                    configurationId: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
                  },
                ],
                taxonomy: "email:sendgrid",
              },
            ],
          },
        },
        objtype: "event",
        tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        title: "Test Notification",
      });
    });
  });

  it("should enqueue a route message", () => {
    const messageBody = JSON.parse(
      (SQS as any as jest.Mock)().sendMessage.mock.calls[0][0].MessageBody
    );
    expect(messageBody).toMatchObject({
      messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
      messageLocation: {
        path: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-5e0f64f5-01f25aca9d89333c7eeaee16.json",
        type: "S3",
      },
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
  });

  it("should create a log entry for 'profile:loaded'", () => {
    expect(
      (eventLogs.createProfileLoadedEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-5e0f64f5-01f25aca9d89333c7eeaee16",
      {
        mergedProfile: {},
        savedProfile: {},
        sentProfile: {},
      },
    ]);
  });
});

describe("basic notification", () => {
  beforeEach(async () => {
    await handle(fixtures.notification.event.Records[0]);
  });

  it("should save inbound input to s3", () => {
    expect((S3 as any as jest.Mock)().putObject.mock.calls[0]).toMatchObject([
      {
        Body: JSON.stringify({
          _meta: {
            messageId: "1-581cf771-a006649127e371903a2de979",
            tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
          },
          brand: undefined,
          courier: {
            environment: "production",
            scope: "published",
          },
          data: {},
          event: "BKNEYT7G40M6ZGKA69F1QD2566H0",
          profile: {},
          recipient: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
          scope: "published/production",
        }),
        Key: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a006649127e371903a2de979.input.json",
      },
    ]);
  });

  describe("saving an outbound s3 file for route processing", () => {
    let body: S3Message;

    beforeEach(() => {
      body = JSON.parse(
        (S3 as any as jest.Mock)().putObject.mock.calls[1][0].Body
      );
    });

    it("should include configurations", () => {
      expect(body.configurations).toMatchObject([
        fixtures.configurations[0], // mailgun
        fixtures.configurations[2], // twilio
      ]);
    });

    it("should include the notification", () => {
      expect(body.notification).toMatchObject({
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        id: "5ceaef68-8101-437e-9a8c-9786688a6344",
        json: {
          blocks: [],
          channels: {
            always: [],
            bestOf: [
              {
                config: {
                  email: {
                    emailSubject: "Email Subject",
                    emailTemplateConfig: {
                      headerLogoAlign: "left",
                      templateName: "line",
                      topBarColor: "#58C87A",
                    },
                  },
                },
                providers: [
                  {
                    config: {},
                    configurationId: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
                  },
                ],
                taxonomy: "email:sendgrid",
              },
              {
                config: {
                  email: {
                    emailSubject: "Email Subject",
                    emailTemplateConfig: {
                      headerLogoAlign: "left",
                      templateName: "line",
                      topBarColor: "#58C87A",
                    },
                  },
                },
                providers: [
                  {
                    config: {},
                    configurationId: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
                  },
                ],
                taxonomy: "email:mailgun",
              },
            ],
          },
        },
        objtype: "event",
        tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        title: "Test Notification",
      });
    });
  });

  it("should enqueue a route message", () => {
    const messageBody = JSON.parse(
      (SQS as any as jest.Mock)().sendMessage.mock.calls[0][0].MessageBody
    );

    expect(messageBody).toMatchObject({
      messageId: "1-581cf771-a006649127e371903a2de979",
      messageLocation: {
        path: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a006649127e371903a2de979.json",
        type: "S3",
      },
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
  });

  it("should create a log entry for 'profile:loaded'", () => {
    expect(
      (eventLogs.createProfileLoadedEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-581cf771-a006649127e371903a2de979",
      {
        mergedProfile: {},
        savedProfile: {},
        sentProfile: {},
      },
    ]);
  });
});

describe("unpublished notification", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockReturnValue({ objects: [{}] });
    (mockHasDrafts as jest.Mock).mockReturnValue(false);
    await handle(fixtures.noProviders.event.Records[0]);
  });

  it("should create an unroutable event log with reason UNPUBLISHED", () => {
    expect(
      (eventLogs.createUnroutableEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-581cf771-a006649127e371903a2de979",
      "UNPUBLISHED",
      "Notification hasn't been published. Current version does not have channels and providers.",
    ]);
  });
});

describe("legacy notification before drafts and before a draft object existed", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockReturnValue({ objects: [] });
    await handle(fixtures.notification.event.Records[0]);
  });

  it("should not create an unroutable event log with reason UNPUBLISHED", () => {
    expect(
      (eventLogs.createUnroutableEvent as jest.Mock).mock.calls.length
    ).toBe(0);
  });
});

describe("legacy notification before drafts and there exists one draft but notification has configuration", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockReturnValue({ objects: [{}] });
    await handle(fixtures.notification.event.Records[0]);
  });

  it("should not create an unroutable event log with reason UNPUBLISHED", () => {
    expect(
      (eventLogs.createUnroutableEvent as jest.Mock).mock.calls.length
    ).toBe(0);
  });
});

describe("no providers found", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockReturnValue({ objects: [{}, {}] });
    (mockHasDrafts as jest.Mock).mockReturnValue(true);
    const event = fixtures.noProviders.event;
    await handle(event.Records[0]);
  });

  it("should save inbound input to s3", () => {
    expect((S3 as any as jest.Mock)().putObject.mock.calls[0]).toMatchObject([
      {
        Body: JSON.stringify({
          _meta: {
            messageId: "1-581cf771-a006649127e371903a2de979",
            tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
          },
          brand: undefined,
          courier: {
            environment: "production",
            scope: "published",
          },
          data: {},
          event: "TWJWCNQQ5Z4C0RGRMPEAK2ZQFHC3",
          profile: {},
          recipient: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
          scope: "published/production",
        }),
        Key: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a006649127e371903a2de979.input.json",
      },
    ]);
  });

  it("should create an undeliverable event log entry", () => {
    expect(
      (eventLogs.createUnroutableEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-581cf771-a006649127e371903a2de979",
      "NO_PROVIDERS",
      "No providers added",
    ]);
  });

  it("should not enqueue a routing message", () => {
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(0);
  });
});

describe("without provider configuration id", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockReturnValue({ objects: [{}, {}] });
    const event = fixtures.channelWithoutConfiguration.event;
    await handle(event.Records[0]);
  });

  it("should save inbound input to s3", () => {
    expect((S3 as any as jest.Mock)().putObject.mock.calls[0]).toMatchObject([
      {
        Body: JSON.stringify({
          _meta: {
            messageId: "1-581cf771-a00787849127e371903a2de979",
            tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
          },
          brand: undefined,
          courier: {
            environment: "production",
            scope: "published",
          },
          data: {},
          event: "GT4NXN70DC40FVM1TWEXAJAXTE4T",
          profile: {},
          recipient: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
          scope: "published/production",
        }),
        Key: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a00787849127e371903a2de979.input.json",
      },
    ]);
  });

  it("should mark the message as having a preparation error", () => {
    expect(
      (eventLogs.createUnroutableEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-581cf771-a00787849127e371903a2de979",
      "NO_PROVIDERS",
      "No providers added",
    ]);
  });

  it("should not enqueue a routing message", () => {
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(0);
  });
});

describe("always", () => {
  beforeEach(async () => {
    const event = fixtures.always.event;
    await handle(event.Records[0]);
  });

  it("should enqueue a routing message for each always entry", () => {
    // 3 = one for each always + one for best of
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(3);
    expect(
      JSON.parse(
        (SQS as any as jest.Mock)().sendMessage.mock.calls[0][0].MessageBody
      )
    ).toMatchObject({
      messageId: "1-581cf771-a006649127e371903a2de979",
      messageLocation: {
        path: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a006649127e371903a2de979.f1bc996e-2470-422b-8e2b-65e8f165ea9e.json",
        type: "S3",
      },
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
    expect(
      JSON.parse(
        (SQS as any as jest.Mock)().sendMessage.mock.calls[1][0].MessageBody
      )
    ).toMatchObject({
      messageId: "1-581cf771-a006649127e371903a2de979",
      messageLocation: {
        path: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a006649127e371903a2de979.ff16c47a-9f65-418f-8a72-199cbf4e8acc.json",
        type: "S3",
      },
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
  });

  it("should enqueue one routing message for bestOf", () => {
    expect(
      JSON.parse(
        (SQS as any as jest.Mock)().sendMessage.mock.calls[2][0].MessageBody
      )
    ).toMatchObject({
      messageId: "1-581cf771-a006649127e371903a2de979",
      messageLocation: {
        path: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d/1-581cf771-a006649127e371903a2de979.json",
        type: "S3",
      },
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
  });

  describe("saving an outbound s3 file for route processing", () => {
    it("should include configurations for each message", () => {
      const { mock } = (S3 as any as jest.Mock)().putObject;
      // always entry 1
      expect(
        new Set(JSON.parse(mock.calls[1][0].Body).configurations)
      ).toMatchObject(new Set(fixtures.configurations));
      // always entry 2
      expect(
        new Set(JSON.parse(mock.calls[2][0].Body).configurations)
      ).toMatchObject(new Set(fixtures.configurations));
      // bestOf
      expect(
        new Set(JSON.parse(mock.calls[3][0].Body).configurations)
      ).toMatchObject(new Set(fixtures.configurations));
    });

    it("should include the notification for each message", () => {
      const { mock } = (S3 as any as jest.Mock)().putObject;

      // always entry 1
      expect(JSON.parse(mock.calls[1][0].Body).notification).toMatchObject({
        ...fixtures.always.notification,
        json: {
          ...fixtures.always.notification.json,
          channels: {
            always: [],
            bestOf: [fixtures.always.notification.json.channels.always[0]],
          },
        },
      });

      // always entry 2
      expect(JSON.parse(mock.calls[2][0].Body).notification).toMatchObject({
        ...fixtures.always.notification,
        json: {
          ...fixtures.always.notification.json,
          channels: {
            always: [],
            bestOf: [fixtures.always.notification.json.channels.always[1]],
          },
        },
      });

      // bestOf
      expect(JSON.parse(mock.calls[3][0].Body).notification).toMatchObject(
        fixtures.always.notification
      );
    });
  });
});

describe("always without best of", () => {
  beforeEach(async () => {
    const event = fixtures.alwaysNoBestOf.event;
    await handle(event.Records[0]);
  });

  it("should not enqueue a routing message for bestOf", () => {
    // 1 for always
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(1);
  });
});

describe("filtered notification", () => {
  beforeEach(async () => {
    await handle(fixtures.filteredNotification.event.Records[0]);
  });

  it("should filter out the notification", async () => {
    expect(
      (eventLogs.createFilteredEvent as jest.Mock).mock.calls[0]
    ).toMatchObject([
      "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      "1-581cf771-a006649127e371903a2de979",
      {
        condition: {
          filters: [
            {
              operator: "EQUALS",
              property: "email",
              source: "profile",
              value: "engineering@courier.com",
            },
          ],
        },
      },
    ]);
  });
});

describe("if error is Internal Courier Error and no retries", () => {
  beforeEach(async () => {
    (mockHasDrafts as jest.Mock).mockRejectedValue(new Error());
    await handle(fixtures.notification.event.Records[0]);
  });

  it("will enqueue to prepare if ttl is falsey", async () => {
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(1);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);

    const messageBody = JSON.parse(
      (SQS as any as jest.Mock)().sendMessage.mock.calls[0][0].MessageBody
    );
    expect(messageBody).toMatchObject({
      messageId: "1-581cf771-a006649127e371903a2de979",
      messageLocation: {
        path: {
          eventData: {},
          eventId: "BKNEYT7G40M6ZGKA69F1QD2566H0",
          eventPreferences: {},
          eventProfile: {},
          recipientId: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
        },
        type: "JSON",
      },
      retryCount: 1,
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
  });
});

describe("if error is Internal Courier Error and eleven retries", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockRejectedValue(new Error());
    await handle(fixtures.notification.eventWithElevenRetries.Records[0]);
  });

  it("will retry message if retry count <= 25", async () => {
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(1);
    const messageBody = (mockRetryMessage as jest.Mock).mock.calls[0][0];
    expect(messageBody).toMatchObject({
      messageId: "1-581cf771-a006649127e371903a2de979",
      messageLocation: {
        path: {
          eventData: {},
          eventId: "BKNEYT7G40M6ZGKA69F1QD2566H0",
          eventPreferences: {},
          eventProfile: {},
          recipientId: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
        },
        type: "JSON",
      },
      retryCount: 12,
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    });
  });
});

describe("if error is Internal Courier Error and 26 retries", () => {
  beforeEach(async () => {
    (mockList as jest.Mock).mockRejectedValue(new Error());
    await handle(fixtures.notification.eventWithTwentySixRetries.Records[0]);
  });

  it("will do nothing if retry count >= 26", async () => {
    expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
  });
});

describe("if scope is draft/production", () => {
  beforeEach(async () => {
    await handle(fixtures.draftScopedNotification.event.Records[0]);
  });

  it("will call the correct services", () => {
    expect((getLatestDraft as jest.Mock).mock.calls.length).toEqual(1);
    expect(
      (DynamoDB.DocumentClient as any as jest.Mock)().get.mock.calls.length
    ).toEqual(1);
  });
});

describe("if scope is published/test", () => {
  beforeEach(async () => {
    await handle(fixtures.testNotification.event.Records[0]);
  });

  it("will call get configuration with the correct tenant id", () => {
    expect((getLatestDraft as jest.Mock).mock.calls.length).toEqual(0);
    expect(
      (DynamoDB.DocumentClient as any as jest.Mock)().get.mock.calls.length
    ).toEqual(2);
    expect(
      (DynamoDB.DocumentClient as any as jest.Mock)().get.mock.calls[0][0].Key
        .tenantId
    ).toContain("test");
  });
});
