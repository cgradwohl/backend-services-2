import parseTaxonomy from "~/lib/parse-taxonomy";

const testCases = new Map<
  string,
  { channel: string; class?: string; provider?: string }
>([
  ["email:*", { channel: "email", class: undefined, provider: "*" }],
  [
    "email:sendgrid",
    { channel: "email", class: undefined, provider: "sendgrid" },
  ],
  [
    "direct_message:sms:*",
    { channel: "direct_message", class: "sms", provider: "*" },
  ],
  [
    "direct_message:sms:twilio",
    { channel: "direct_message", class: "sms", provider: "twilio" },
  ],
]);

describe("when parsing taxonomy", () => {
  for (const [taxonomy, expected] of testCases) {
    it(`will return the expected result for ${taxonomy}`, () =>
      expect(parseTaxonomy(taxonomy)).toStrictEqual(expected));
  }
});
