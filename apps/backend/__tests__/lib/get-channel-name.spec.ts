import getChannelName from "~/lib/get-channel-name";
import { ChannelDetails } from "~/types.internal";

describe("when getting channel label", () => {
  const testCases: ReadonlyArray<[ChannelDetails, string]> = [
    [{ id: "id", label: "Yeet", taxonomy: "email:*" }, "email"],
    [{ id: "id", label: "", taxonomy: "email:*" }, "email"],
    [{ id: "id", label: undefined, taxonomy: "email:sendgrid" }, "email"],
    [{ id: "id", label: undefined, taxonomy: "direct_message:sms:*" }, "sms"],
    [
      { id: "id", label: undefined, taxonomy: "direct_message:sms:twilio" },
      "sms",
    ],
    [{ id: "id", label: undefined, taxonomy: "push:mobile:*" }, "push"],
    [{ id: "id", label: undefined, taxonomy: "push:mobile:expo" }, "push"],
  ];

  for (const [channel, expected] of testCases) {
    it(`will return ${expected}`, () => {
      expect(getChannelName(channel)).toBe(expected);
    });
  }
});
