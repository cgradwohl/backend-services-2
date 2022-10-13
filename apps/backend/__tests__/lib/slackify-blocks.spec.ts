import { searchAndSlackifyBlocks } from "~/handlebars/template/slack";

describe("should slackifyBlocks", () => {
  it("will remove falsy values", () => {
    expect(
      searchAndSlackifyBlocks(
        [
          {
            type: "section",
            text: {
              slackify: true,
              text: "# Test123",
              type: "mrkdwn",
            },
            fields: [
              {
                slackify: true,
                type: "mrkdwn",
                text: `# List of items\n\n* item 1\n* item 2\n* item 3\n\n[here is an example](https://example.com)`,
              },
              {
                type: "plain_text",
                emoji: true,
                text: "String",
              },
            ],
          },
        ],
        ""
      )
    ).toEqual([
      {
        type: "section",
        text: {
          text: "*Test123*\n",
          type: "mrkdwn",
        },
        fields: [
          {
            type: "mrkdwn",
            text: "*List of items*\n\n•   item 1\n•   item 2\n•   item 3\n\n<https://example.com|here is an example>\n",
          },
          {
            type: "plain_text",
            emoji: true,
            text: "String",
          },
        ],
      },
    ]);
  });
});
