import parseSlackWebhookBody from "~/lib/slack/parse-slack-webhook-body";

describe("parseSlackWebhookBody", () => {
  const origConsole = global.console;

  beforeEach(() => {
    global.console = {
      ...origConsole,
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    } as any;
  });

  afterEach(() => {
    global.console = origConsole;
  });

  it("should get the payload value from a Slack webhook body", () => {
    const myData = { test: true };
    const testBody = `payload=${encodeURIComponent(JSON.stringify(myData))}`;
    expect(parseSlackWebhookBody(testBody)).toEqual(myData);
  });

  it("should throw if it fails to parse", () => {
    expect(() => parseSlackWebhookBody("bad")).toThrow(
      /^Body could not be parsed/
    );
    expect(() => parseSlackWebhookBody("payload=bad&encoding")).toThrow(
      /^Body could not be parsed/
    );
    expect(() => parseSlackWebhookBody("payload={invalid json}")).toThrow(
      /^Body could not be parsed/
    );
  });
});
