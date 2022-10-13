import getBlocks from "~/lib/blocks";
import renderBlocks from "~/lib/render/blocks";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { BlockType, IJsonnetBlockConfig } from "~/types.api";

const mockConfig = {
  provider: "mailjet",
};

const mockBlockConfig: IJsonnetBlockConfig = {
  template: `
    [
        { 
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*%s*" % pmon.name
          }
        }
        for pmon in data("pokemon")
    ]`,
};

const mockVariableData = {
  data: {
    pokemon: [
      {
        name: "joshmon",
      },
      {
        name: "dannymon",
      },
      {
        name: "aydrianmon",
      },
      {
        name: "troymon",
      },
      {
        name: "rileymon",
      },
      {
        name: "kaymon",
      },
      {
        name: "amanmon",
      },
      {
        name: "sethmon",
      },
      {
        name: "tonymon",
      },
      {
        name: "natemon",
      },
    ],
  },
  event: "mockEvent",
  profile: {},
  recipient: "riley@courier.com",
};
const mockLinkHandler = createLinkHandler({});
const mockVariableHandler = createVariableHandler({
  value: mockVariableData,
}).getScoped("data");

const mockBlock = {
  config: JSON.stringify(mockBlockConfig),
  id: "mockId",
  type: "jsonnet" as BlockType,
};

const mockParams: any = {
  config: mockConfig,
  profile: mockVariableData.profile,
  variableHandler: mockVariableHandler,
};

describe("blocks", () => {
  it("should support array of jsonnet", () => {
    const params: any = {
      ...mockParams,
      variableHandler: createVariableHandler({
        value: mockVariableData,
      }).getScoped("data"),
    };

    const blocks = renderBlocks(
      getBlocks([mockBlock], mockLinkHandler, params.variableHandler),
      "slack"
    );

    expect(blocks).toEqual([
      { text: { text: "*joshmon*", type: "mrkdwn" }, type: "section" },
      {
        text: { text: "*dannymon*", type: "mrkdwn" },
        type: "section",
      },
      {
        text: { text: "*aydrianmon*", type: "mrkdwn" },
        type: "section",
      },
      { text: { text: "*troymon*", type: "mrkdwn" }, type: "section" },
      {
        text: { text: "*rileymon*", type: "mrkdwn" },
        type: "section",
      },
      { text: { text: "*kaymon*", type: "mrkdwn" }, type: "section" },
      { text: { text: "*amanmon*", type: "mrkdwn" }, type: "section" },
      { text: { text: "*sethmon*", type: "mrkdwn" }, type: "section" },
      { text: { text: "*tonymon*", type: "mrkdwn" }, type: "section" },
      { text: { text: "*natemon*", type: "mrkdwn" }, type: "section" },
    ]);
  });
});
