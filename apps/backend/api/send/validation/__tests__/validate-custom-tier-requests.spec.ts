import { Message } from "~/api/send/types";
import { PaymentRequired } from "~/lib/http-errors";
import { isCustomTierTenantId } from "~/lib/plan-pricing";
import { validateV2CustomTierRequests } from "../validate-v2-custom-tier-requests";

jest.mock("~/lib/plan-pricing");
const mockIsCustomTierTenantId = isCustomTierTenantId as jest.Mock;

const message: Message = {
  to: { email: "me@me.com" },
  content: { body: "hello" },
  template: "foo",
  timeout: {
    message: 500,
  },
};

const paidSequence = [
  {
    action: "emit",
    message: { ...message, providers: { apn: { timeout: 5 } } },
  },
];

const freeSequence = [{ action: "emit", message }];

describe("validate custom tier v2 send request", () => {
  beforeEach(jest.clearAllMocks);

  it("should not throw for a valid free message", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests({ message }, "")
    ).resolves.not.toThrow();
  });

  it("should throw payment required for timeout.channel", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests(
        { message: { ...message, timeout: { channel: 4 } } },
        ""
      )
    ).rejects.toThrow(PaymentRequired);
  });

  it("should throw payment required for timeout.provider", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests(
        { message: { ...message, timeout: { provider: 4 } } },
        ""
      )
    ).rejects.toThrow(PaymentRequired);
  });

  it("should throw payment required for channels.channel.timeout", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests(
        { message: { ...message, channels: { channel: { timeout: 5 } } } },
        ""
      )
    ).rejects.toThrow(PaymentRequired);
  });

  it("should throw payment required for providers.provider.timeout", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests(
        { message: { ...message, providers: { apn: { timeout: 5 } } } },
        ""
      )
    ).rejects.toThrow(PaymentRequired);
  });

  it("should not throw payment required for paid feature when tenant is custom tier", () => {
    mockIsCustomTierTenantId.mockResolvedValue(true);
    return expect(
      validateV2CustomTierRequests(
        { message: { ...message, providers: { apn: { timeout: 5 } } } },
        ""
      )
    ).resolves.not.toThrow();
  });

  it("should not throw payment required for paid feature when tenant is custom tier and send is a sequence", () => {
    mockIsCustomTierTenantId.mockResolvedValue(true);
    return expect(
      validateV2CustomTierRequests({ sequence: paidSequence }, "")
    ).resolves.not.toThrow();
  });

  it("should throw payment required for paid message feature and send is a sequence", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests({ sequence: paidSequence }, "")
    ).rejects.toThrow(PaymentRequired);
  });

  it("should throw payment required for paid feature when tenant is not custom tier and send is a sequence", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests({ sequence: paidSequence }, "")
    ).rejects.toThrow(PaymentRequired);
  });

  it("should not throw payment required for free message when tenant is not custom tier and send is a sequence", () => {
    mockIsCustomTierTenantId.mockResolvedValue(false);
    return expect(
      validateV2CustomTierRequests({ sequence: freeSequence }, "")
    ).resolves.not.toThrow();
  });

  it("should not throw for invalid request", () => {
    mockIsCustomTierTenantId.mockResolvedValue(true);
    return expect(validateV2CustomTierRequests({}, "")).resolves.not.toThrow();
  });
});
