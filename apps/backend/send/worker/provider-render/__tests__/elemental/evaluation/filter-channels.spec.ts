import { ElementalChannelNodeIR, ElementalIR } from "~/api/send/types";
import {
  filterChannels,
  filterChannelSpecificElements,
  filterTopLevelChannelElements,
} from "~/send/worker/provider-render/elemental/evaluation/filter-channels";

describe("channel logic evaluation", () => {
  describe("filterChannels", () => {
    it("should filter channel-filtered elemental elements", () => {
      const ir: ElementalIR = [
        {
          type: "meta",
          title: "test sms title",
          channels: ["sms"],
          index: 0,
          visible: true,
        },
        {
          type: "meta",
          title: "test title",
          channels: ["email"],
          index: 1,
          visible: true,
        },
        {
          type: "text",
          content: "test sms body",
          channels: ["sms"],
          index: 2,
          visible: true,
        },
        {
          type: "text",
          content: "test body",
          channels: ["email"],
          index: 3,
          visible: true,
        },
      ];

      const filtered = filterChannels({ ir, channel: "email" });
      expect(filtered.length).toBe(2);
      expect(filtered[0].type).toBe("meta");
      expect(filtered[1].type).toBe("text");
    });

    it("should filter top level channel elements", () => {
      const ir: ElementalIR = [
        {
          type: "channel",
          channel: "default",
          index: 0,
          visible: true,
          elements: [
            {
              type: "meta",
              title: "My Title",
              index: 1,
              visible: true,
            },
            {
              type: "text",
              content: "Hello **world**",
              index: 2,
              visible: true,
            },
          ],
        },
        {
          type: "channel",
          channel: "email",
          index: 3,
          visible: true,
          elements: [
            {
              type: "meta",
              title: "My Subject",
              index: 4,
              visible: true,
            },
            {
              type: "text",
              content: "My email body",
              index: 5,
              visible: true,
            },
          ],
        },
      ];

      const filtered = filterChannels({ ir, channel: "email" });
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe("channel");
      expect((filtered[0] as any).elements?.[0]?.title).toBe("My Subject");
    });
  });

  describe("filterChannelSpecificElements", () => {
    it("should filter channel-filtered elemental elements", () => {
      const ir: ElementalIR = [
        {
          type: "meta",
          title: "test sms title",
          channels: ["sms"],
          index: 0,
          visible: true,
        },
        {
          type: "meta",
          title: "test title",
          channels: ["email"],
          index: 1,
          visible: true,
        },
        {
          type: "text",
          content: "test sms body",
          channels: ["sms"],
          index: 2,
          visible: true,
        },
        {
          type: "text",
          content: "test body",
          channels: ["email"],
          index: 3,
          visible: true,
        },
      ];

      const filtered = filterChannelSpecificElements({ ir, channel: "email" });
      expect(filtered.length).toBe(2);
      expect(filtered[0].type).toBe("meta");
      expect(filtered[1].type).toBe("text");
    });
  });

  describe("filterTopLevelChannelElements", () => {
    it("should return email elements", () => {
      const emailIR: ElementalChannelNodeIR = {
        type: "channel",
        channel: "email",
        index: 3,
        visible: true,
        elements: [
          {
            type: "meta",
            title: "My Subject",
            index: 4,
            visible: true,
          },
          {
            type: "text",
            content: "My email body",
            index: 5,
            visible: true,
          },
        ],
      };
      const ir: ElementalIR = [
        {
          type: "channel",
          channel: "default",
          index: 0,
          visible: true,
          elements: [
            {
              type: "meta",
              title: "My Title",
              index: 1,
              visible: true,
            },
            {
              type: "text",
              content: "Hello **world**",
              index: 2,
              visible: true,
            },
          ],
        },
        emailIR,
      ];

      const filtered = filterTopLevelChannelElements({ ir, channel: "email" });
      expect(filtered[0]).toEqual(emailIR);
    });

    it("should return default elements", () => {
      const defaultChannel: ElementalChannelNodeIR = {
        type: "channel",
        channel: "default",
        index: 0,
        visible: true,
        elements: [
          {
            type: "meta",
            title: "My Title",
            index: 1,
            visible: true,
          },
          {
            type: "text",
            content: "Hello **world**",
            index: 2,
            visible: true,
          },
        ],
      };
      const ir: ElementalIR = [
        defaultChannel,
        {
          type: "channel",
          channel: "email",
          index: 3,
          visible: true,
          elements: [
            {
              type: "meta",
              title: "My Subject",
              index: 4,
              visible: true,
            },
            {
              type: "text",
              content: "My email body",
              index: 5,
              visible: true,
            },
          ],
        },
      ];

      const filtered = filterTopLevelChannelElements({ ir });
      expect(filtered[0]).toEqual(defaultChannel);
    });

    it("should throw an error if no matching channel element and no default", () => {
      const ir: ElementalIR = [
        {
          type: "channel",
          channel: "sms",
          index: 0,
          visible: true,
          elements: [
            {
              type: "text",
              content: "My sns body",
              index: 1,
              visible: true,
            },
          ],
        },
      ];

      expect(() =>
        filterTopLevelChannelElements({ ir, channel: "email" })
      ).toThrow();
    });
  });
});
