import generateSlackWebhookBody from "~/lib/slack/generate-slack-webhook-body";
import parseSlackWebhookBody from "~/lib/slack/parse-slack-webhook-body";

describe("generateSlackWebhookBody", () => {
  it("should encode a payload in the same way Slack does for a webhook body", () => {
    const myData = { test: true };
    expect(generateSlackWebhookBody(myData)).toMatchInlineSnapshot(
      `"payload=%7B%22test%22%3Atrue%7D"`
    );
  });

  it("should work with parseSlackWebhookBody", () => {
    const myData = { test: true };
    expect(parseSlackWebhookBody(generateSlackWebhookBody(myData))).toEqual(
      myData
    );
  });
});
