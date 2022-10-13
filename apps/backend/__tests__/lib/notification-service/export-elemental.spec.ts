import {
  ElementalActionNode,
  ElementalCommentNode,
  ElementalMetaNode,
  ElementalTextNode,
} from "~/api/send/types";
import { exportElemental } from "~/lib/notification-service/export-elemental";
import { CourierObject, INotificationJsonWire } from "~/types.api";

describe("Export to Elemental", () => {
  describe("Text Block", () => {
    it("will emit a text node", async () => {
      const notification: CourierObject<INotificationJsonWire> = {
        created: 123,
        creator: "abc",
        id: "foo-bar",
        json: {
          blocks: [
            {
              config:
                '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Hello ","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"inline","type":"variable","data":{"value":"{firstName}"},"nodes":[{"object":"text","text":"{firstName}","marks":[{"object":"mark","type":"bold","data":{}}]}]},{"object":"text","text":",\\n\\n","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":"How is your ","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"inline","type":"highlight","data":{"color":"#FFCC58","brandColors":false},"nodes":[{"object":"text","text":"day","marks":[{"object":"mark","type":"underlined","data":{}},{"object":"mark","type":"textColor","data":{"color":"#24AF9C","brandColors":false}}]}]},{"object":"text","text":"?\\n\\n","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"text","text":"I hope it is ","marks":[]},{"object":"text","text":"well","marks":[{"object":"mark","type":"italic","data":{}},{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":" ","marks":[{"object":"mark","type":"italic","data":{}}]},{"object":"text","text":":)\\n\\nClick ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://www.courier.com","text":"Here","disableLinkTracking":false},"nodes":[{"object":"text","text":"Here","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}},"align":"left"}',
              id: "123",
              type: "text",
            },
          ],
          channels: {
            always: [],
            bestOf: [],
          },
        },
        objtype: "event",
        tenantId: "tenant-1",
        title: "foo",
      };
      const expectedContent =
        `**Hello **{**{firstName}**}**,**` +
        `\n\n+How is your ++day++?+` +
        `\n\nI hope it is ***well**** *:)` +
        `\n\nClick [Here](https://www.courier.com)`;

      const nodes = exportElemental({ notification });

      expect(nodes.length).toBe(1);
      expect(nodes[0].type).toBe("text");

      const textNode = nodes[0] as ElementalTextNode;
      expect(textNode.content).toBe(expectedContent);
    });
  });

  describe("Action Block", () => {
    it("will emit an action node", async () => {
      const notification: CourierObject<INotificationJsonWire> = {
        created: 123,
        creator: "abc",
        id: "foo-bar",
        json: {
          blocks: [
            {
              config:
                '{"align":"center","backgroundColor":"{brand.colors.primary}","href":"https://www.courier.com","style":"link","text":"Yo Action","disableLinkTracking":false}',
              id: "123",
              type: "action",
            },
          ],
          channels: {
            always: [],
            bestOf: [],
          },
        },
        objtype: "event",
        tenantId: "tenant-1",
        title: "foo",
      };
      const nodes = exportElemental({ notification });

      expect(nodes.length).toBe(1);
      expect(nodes[0].type).toBe("action");

      const actionNode = nodes[0] as ElementalActionNode;
      expect(actionNode.content).toBe("Yo Action");
    });
  });

  describe("Unimplemented block", () => {
    it("will emit a comment node if block is not supported", () => {
      const notification: CourierObject<INotificationJsonWire> = {
        created: 123,
        creator: "abc",
        id: "foo-bar",
        json: {
          blocks: [
            {
              config: "",
              id: "123",
              type: "image",
            },
          ],
          channels: {
            always: [],
            bestOf: [],
          },
        },
        objtype: "event",
        tenantId: "tenant-1",
        title: "foo",
      };
      const nodes = exportElemental({ notification });

      expect(nodes.length).toBe(1);
      expect(nodes[0].type).toBe("comment");

      const commentNode = nodes[0] as ElementalCommentNode;
      expect(commentNode.comment).toBe(
        "This block is not yet supported by Elemental export."
      );
    });
  });

  describe("Channels meta node", () => {
    it("will emit meta nodes for email subject and push title", () => {
      const notification: CourierObject<INotificationJsonWire> = {
        created: 123,
        creator: "abc",
        id: "foo-bar",
        json: {
          blocks: [],
          channels: {
            always: [
              {
                blockIds: [],
                config: {
                  email: {
                    emailSubject: "hi I am a subject",
                  },
                },
                id: "c1",
                providers: [],
                taxonomy: "",
              },
              {
                blockIds: [],
                config: {
                  push: {
                    clickAction: "",
                    icon: "",
                    title: "bye I am a title",
                  },
                },
                id: "c2",
                providers: [],
                taxonomy: "",
              },
            ],
            bestOf: [],
          },
        },
        objtype: "event",
        tenantId: "tenant-1",
        title: "foo",
      };
      const nodes = exportElemental({ notification });

      expect(nodes.length).toBe(2);

      expect(nodes[0].type).toBe("meta");
      const metaNode1 = nodes[0] as ElementalMetaNode;
      expect(metaNode1.title).toBe("hi I am a subject");

      expect(nodes[1].type).toBe("meta");
      const metaNode2 = nodes[1] as ElementalMetaNode;
      expect(metaNode2.title).toBe("bye I am a title");
    });
  });

  describe("Channels deduping", () => {
    it("will emit a single meta node per channel", () => {
      const notification: CourierObject<INotificationJsonWire> = {
        created: 123,
        creator: "abc",
        id: "foo-bar",
        json: {
          blocks: [],
          channels: {
            always: [
              {
                blockIds: [],
                config: {
                  email: {
                    emailSubject: "hi I am a subject",
                  },
                },
                id: "c1",
                providers: [],
                taxonomy: "",
              },
              {
                blockIds: [],
                config: {
                  push: {
                    clickAction: "",
                    icon: "",
                    title: "bye I am a title",
                  },
                },
                id: "c2",
                providers: [],
                taxonomy: "",
              },
            ],
            bestOf: [
              {
                blockIds: [],
                config: {
                  email: {
                    emailSubject: "hi I am a subject",
                  },
                },
                id: "c1",
                providers: [],
                taxonomy: "",
              },
              {
                blockIds: [],
                config: {
                  push: {
                    clickAction: "",
                    icon: "",
                    title: "bye I am a title",
                  },
                },
                id: "c2",
                providers: [],
                taxonomy: "",
              },
            ],
          },
        },
        objtype: "event",
        tenantId: "tenant-1",
        title: "foo",
      };
      const nodes = exportElemental({ notification });

      expect(nodes.length).toBe(2);

      expect(nodes[0].type).toBe("meta");
      const metaNode1 = nodes[0] as ElementalMetaNode;
      expect(metaNode1.title).toBe("hi I am a subject");

      expect(nodes[1].type).toBe("meta");
      const metaNode2 = nodes[1] as ElementalMetaNode;
      expect(metaNode2.title).toBe("bye I am a title");
    });
  });
});
