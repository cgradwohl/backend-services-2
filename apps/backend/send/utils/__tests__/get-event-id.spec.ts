import { ContentMessage, TemplateMessage } from "~/api/send/types";
import { getEventId } from "../get-event-id";

jest.mock("~/lib/crypto-helpers", () => ({
  createMd5Hash: () => "hash-event-id",
}));

describe("getEventId", () => {
  it("should return the template value from a TemplateMessage", () => {
    const message: TemplateMessage = {
      to: {
        email: "test@test.com",
      },
      template: "template-event-id",
    };

    const result = getEventId(message);

    expect(result).toBe(message.template);
  });

  it("should return the metadata.event value from a ContentMessage", () => {
    const message: ContentMessage = {
      to: {
        email: "test@test.com",
      },
      content: {
        title: "title",
        body: "foo",
      },
      metadata: {
        event: "metadata-event-id",
      },
    };

    const result = getEventId(message);

    expect(result).toBe(message.metadata.event);
  });

  it("should return an anon hash value from a ContentMessage", () => {
    const message: ContentMessage = {
      to: {
        email: "test@test.com",
      },
      content: {
        title: "title",
        body: "foo",
      },
    };

    const result = getEventId(message);

    expect(result).toBe("inline_hash-event-id");
  });
});
