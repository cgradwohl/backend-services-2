import getChannelLabel from "~/lib/get-channel-label";
import { ChannelDetails } from "~/types.internal";

describe("when getting channel label", () => {
  const testCases: ReadonlyArray<[ChannelDetails, string]> = [
    [{ id: "id", label: "Yeet", taxonomy: "email:*" }, "Yeet"],
    [{ id: "id", label: "", taxonomy: "email:*" }, "email"],
    [{ id: "id", label: undefined, taxonomy: "email:sendgrid" }, "email"],
    [{ id: "id", label: undefined, taxonomy: "direct_message:sms:*" }, "sms"],
    [
      { id: "id", label: undefined, taxonomy: "direct_message:sms:twilio" },
      "sms",
    ],
    [{ id: "id", label: undefined, taxonomy: "push:mobile:*" }, "push-mobile"],
    [
      { id: "id", label: undefined, taxonomy: "push:mobile:expo" },
      "push-mobile",
    ],
  ];

  for (const [channel, expected] of testCases) {
    it(`will return ${expected}`, () => {
      expect(getChannelLabel(channel)).toBe(expected);
    });
  }
});
