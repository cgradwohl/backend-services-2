import { transformRequest } from "~/api/notifications/locales/transforms/block/put";
import { BlockWire } from "~/types.api";

describe("put block locales", () => {
  it("will creating slate from html", () => {
    const block: BlockWire = {
      config:
        '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Lorem ipsum dolor, sit amet.","marks":[]}]}]}},"locales":{"fr_FR":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"paragraph","data":{},"nodes":[{"object":"text","text":"frlorem fripsum","marks":[]}]}]}},"it_IT":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"paragraph","data":{},"nodes":[{"object":"text","text":"put itorem","marks":[]}]}]}}}}',
      id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
      type: "text",
    };

    const templateLocales = transformRequest(
      {
        id: "123",
        tenantId: "mockTenantId",
        created: 123,
        creator: "riley",
        objtype: "notification-draft",
        title: "My Template",
        json: {
          channels: {
            bestOf: [],
            always: [],
          },
          blocks: [block],
        },
      },
      "block_bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
      {
        fr_FR: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "frlorem fripsum", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "French Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " frenchFrom ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " frenchSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { subject: "Frhello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
          ],
        },
        it_IT: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "put itorem", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "Italian Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
          ],
          channels: [
            {
              content: { subject: "italian hello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
            {
              content: { title: "italian push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        en_GB: {
          blocks: [
            {
              content: "British click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " british from ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " britishSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { title: "british push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
      },
      {
        cn_CN: "Chinese text block",
      }
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "frlorem fripsum", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "French Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " frenchFrom ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " frenchSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { subject: "Frhello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
        ],
      },
      it_IT: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [{ object: "text", text: "put itorem", marks: [] }],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Italian Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
        ],
        channels: [
          {
            content: { subject: "italian hello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
          {
            content: { title: "italian push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      en_GB: {
        blocks: [
          {
            content: "British click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " british from ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " britishSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { title: "british push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      cn_CN: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "Chinese text block", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
        ],
        channels: [],
      },
    });
  });

  it("will update action block", () => {
    const block: BlockWire = {
      config:
        '{"align":"center","backgroundColor":"{brand.colors.primary}","href":"https://www.courier.com","style":"button","text":"Click Here","locales":{"fr_FR":"French Click here","it_IT":"Italian Click here","en_GB":"British click here"}}',
      id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
      type: "action",
    };

    const templateLocales = transformRequest(
      {
        id: "123",
        tenantId: "mockTenantId",
        created: 123,
        creator: "riley",
        objtype: "notification-draft",
        title: "My Template",
        json: {
          channels: {
            bestOf: [],
            always: [],
          },
          blocks: [block],
        },
      },
      "block_ee6ae50f-3440-436d-8e4f-8b5c7897123c",
      {
        fr_FR: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "frlorem fripsum", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "French Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " frenchFrom ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " frenchSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { subject: "Frhello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
          ],
        },
        it_IT: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "put itorem", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "Italian Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
          ],
          channels: [
            {
              content: { subject: "italian hello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
            {
              content: { title: "italian push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        en_GB: {
          blocks: [
            {
              content: "British click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " british from ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " britishSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { title: "british push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        cn_CN: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "text",
                          text: "Chinese text block",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
          ],
          channels: [],
        },
      },
      {
        cn_CN: "Chinese action block",
      }
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "frlorem fripsum", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "French Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " frenchFrom ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " frenchSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { subject: "Frhello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
        ],
      },
      it_IT: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [{ object: "text", text: "put itorem", marks: [] }],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Italian Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
        ],
        channels: [
          {
            content: { subject: "italian hello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
          {
            content: { title: "italian push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      en_GB: {
        blocks: [
          {
            content: "British click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " british from ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " britishSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { title: "british push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      cn_CN: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "Chinese text block", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Chinese action block",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
        ],
        channels: [],
      },
    });
  });

  it("will update template block", () => {
    const block: BlockWire = {
      config: '{"template":"<div>Hello World</div>"}',
      id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
      type: "template",
    };

    const templateLocales = transformRequest(
      {
        id: "123",
        tenantId: "mockTenantId",
        created: 123,
        creator: "riley",
        objtype: "notification-draft",
        title: "My Template",
        json: {
          channels: {
            bestOf: [],
            always: [],
          },
          blocks: [block],
        },
      },
      "block_2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
      {
        fr_FR: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "frlorem fripsum", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "French Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " frenchFrom ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " frenchSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { subject: "Frhello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
          ],
        },
        it_IT: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "put itorem", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "Italian Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
          ],
          channels: [
            {
              content: { subject: "italian hello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
            {
              content: { title: "italian push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        en_GB: {
          blocks: [
            {
              content: "British click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " british from ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " britishSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { title: "british push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        cn_CN: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "text",
                          text: "Chinese text block",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "Chinese action block",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
          ],
          channels: [],
        },
      },
      {
        cn_CN: "<div>Chinese hello world</div>",
      }
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "frlorem fripsum", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "French Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " frenchFrom ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " frenchSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { subject: "Frhello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
        ],
      },
      it_IT: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [{ object: "text", text: "put itorem", marks: [] }],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Italian Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
        ],
        channels: [
          {
            content: { subject: "italian hello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
          {
            content: { title: "italian push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      en_GB: {
        blocks: [
          {
            content: "British click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " british from ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " britishSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { title: "british push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      cn_CN: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "Chinese text block", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Chinese action block",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content: "<div>Chinese hello world</div>",
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
        ],
        channels: [],
      },
    });
  });

  it("will update list block", () => {
    const block: BlockWire = {
      config:
        '{"child":{"imageHref":"","imagePath":"","path":"children","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"","marks":[]},{"object":"inline","type":"variable","data":{"value":"{fname}"},"nodes":[{"object":"text","text":"{fname}","marks":[]}]},{"object":"text","text":" ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{lname}"},"nodes":[{"object":"text","text":"{lname}","marks":[]}]},{"object":"text","text":" from ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{cname}"},"nodes":[{"object":"text","text":"{cname}","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}},"locales":{}},"top":{"background":"#4C4C4C","imageHref":"","imagePath":"","path":"parent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"","marks":[]},{"object":"inline","type":"variable","data":{"value":"{topic}"},"nodes":[{"object":"text","text":"{topic}","marks":[]}]},{"object":"text","text":" subscribers","marks":[]}]}]}},"locales":{}},"useChildren":true,"useImages":false,"locales":{"fr_FR":{"children":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"paragraph","data":{},"nodes":[{"object":"inline","type":"variable","data":{"value":"{fname}","$sourceId":"3"},"nodes":[{"object":"text","text":"{fname}","marks":[]}]},{"object":"text","text":" ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{lname}","$sourceId":"6"},"nodes":[{"object":"text","text":"{lname}","marks":[]}]},{"object":"text","text":" frenchFrom ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{cname}","$sourceId":"9"},"nodes":[{"object":"text","text":"{cname}","marks":[]}]}]}]}},"parent":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"paragraph","data":{},"nodes":[{"object":"inline","type":"variable","data":{"value":"{topic}","$sourceId":"3"},"nodes":[{"object":"text","text":"{topic}","marks":[]}]},{"object":"text","text":" frenchSubscribers","marks":[]}]}]}}},"en_GB":{"children":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"paragraph","data":{},"nodes":[{"object":"inline","type":"variable","data":{"value":"{fname}","$sourceId":"3"},"nodes":[{"object":"text","text":"{fname}","marks":[]}]},{"object":"text","text":" ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{lname}","$sourceId":"6"},"nodes":[{"object":"text","text":"{lname}","marks":[]}]},{"object":"text","text":" british from ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{cname}","$sourceId":"9"},"nodes":[{"object":"text","text":"{cname}","marks":[]}]}]}]}},"parent":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"paragraph","data":{},"nodes":[{"object":"inline","type":"variable","data":{"value":"{topic}","$sourceId":"3"},"nodes":[{"object":"text","text":"{topic}","marks":[]}]},{"object":"text","text":" britishSubscribers","marks":[]}]}]}}}}}',
      id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
      type: "list",
    };

    const templateLocales = transformRequest(
      {
        id: "123",
        tenantId: "mockTenantId",
        created: 123,
        creator: "riley",
        objtype: "notification-draft",
        title: "My Template",
        json: {
          channels: {
            bestOf: [],
            always: [],
          },
          blocks: [block],
        },
      },
      "block_567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
      {
        fr_FR: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "frlorem fripsum", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "French Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " frenchFrom ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " frenchSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { subject: "Frhello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
          ],
        },
        it_IT: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        { object: "text", text: "put itorem", marks: [] },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "Italian Click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
          ],
          channels: [
            {
              content: { subject: "italian hello" },
              id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
            },
            {
              content: { title: "italian push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        en_GB: {
          blocks: [
            {
              content: "British click here",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content:
                '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
            {
              content: {
                children: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{fname}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{fname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{lname}", $sourceId: "6" },
                            nodes: [
                              { object: "text", text: "{lname}", marks: [] },
                            ],
                          },
                          { object: "text", text: " british from ", marks: [] },
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{cname}", $sourceId: "9" },
                            nodes: [
                              { object: "text", text: "{cname}", marks: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                parent: {
                  object: "value",
                  document: {
                    object: "document",
                    data: {},
                    nodes: [
                      {
                        object: "block",
                        type: "paragraph",
                        data: {},
                        nodes: [
                          {
                            object: "inline",
                            type: "variable",
                            data: { value: "{topic}", $sourceId: "3" },
                            nodes: [
                              { object: "text", text: "{topic}", marks: [] },
                            ],
                          },
                          {
                            object: "text",
                            text: " britishSubscribers",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
              type: "list",
            },
          ],
          channels: [
            {
              content: { title: "british push title" },
              id: "07b8d082-60f1-4fed-976e-a245c14aa244",
            },
          ],
        },
        cn_CN: {
          blocks: [
            {
              content: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "text",
                          text: "Chinese text block",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
              id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
              type: "text",
            },
            {
              content: "Chinese action block",
              id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
              type: "action",
            },
            {
              content: "<div>Chinese hello world</div>",
              id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
              type: "template",
            },
          ],
          channels: [],
        },
      },
      {
        cn_CN: {
          parent: '<variable id="3">{topic}</variable> britishSubscribers',
          children:
            '<variable id="3">{fname}</variable> <variable id="6">{lname}</variable> british from <variable id="9">{cname}</variable>',
        },
      }
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      { object: "text", text: "frlorem fripsum", marks: [] },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "French Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">French hello world</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " frenchFrom ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " frenchSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { subject: "Frhello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
        ],
      },
      it_IT: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [{ object: "text", text: "put itorem", marks: [] }],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Italian Click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
        ],
        channels: [
          {
            content: { subject: "italian hello" },
            id: "d8fb73f3-7cc5-4fdf-a3e8-00ee08e67633",
          },
          {
            content: { title: "italian push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      en_GB: {
        blocks: [
          {
            content: "British click here",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content:
              '<style>\n  .template {\n    color: blue;\n  }\n</style>\n\n\n<div class="template">Hello World mate</div>',
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{fname}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{fname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{lname}", $sourceId: "6" },
                          nodes: [
                            { object: "text", text: "{lname}", marks: [] },
                          ],
                        },
                        { object: "text", text: " british from ", marks: [] },
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{cname}", $sourceId: "9" },
                          nodes: [
                            { object: "text", text: "{cname}", marks: [] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: { value: "{topic}", $sourceId: "3" },
                          nodes: [
                            { object: "text", text: "{topic}", marks: [] },
                          ],
                        },
                        {
                          object: "text",
                          text: " britishSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [
          {
            content: { title: "british push title" },
            id: "07b8d082-60f1-4fed-976e-a245c14aa244",
          },
        ],
      },
      cn_CN: {
        blocks: [
          {
            content: {
              object: "value",
              document: {
                object: "document",
                data: {},
                nodes: [
                  {
                    object: "block",
                    type: "paragraph",
                    data: {},
                    nodes: [
                      {
                        object: "text",
                        text: "Chinese text block",
                        marks: [],
                      },
                    ],
                  },
                ],
              },
            },
            id: "bae41d0e-84f4-4515-bdf1-4e38b7f1b6b3",
            type: "text",
          },
          {
            content: "Chinese action block",
            id: "ee6ae50f-3440-436d-8e4f-8b5c7897123c",
            type: "action",
          },
          {
            content: "<div>Chinese hello world</div>",
            id: "2de143f4-8c92-4d18-8f60-464dfe1ab6e6",
            type: "template",
          },
          {
            content: {
              children: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: {
                            value: "{fname}",
                            $sourceId: "3",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "{fname}",
                              marks: [],
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: " ",
                          marks: [],
                        },
                        {
                          object: "inline",
                          type: "variable",
                          data: {
                            value: "{lname}",
                            $sourceId: "6",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "{lname}",
                              marks: [],
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: " british from ",
                          marks: [],
                        },
                        {
                          object: "inline",
                          type: "variable",
                          data: {
                            value: "{cname}",
                            $sourceId: "9",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "{cname}",
                              marks: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              parent: {
                object: "value",
                document: {
                  object: "document",
                  data: {},
                  nodes: [
                    {
                      object: "block",
                      type: "paragraph",
                      data: {},
                      nodes: [
                        {
                          object: "inline",
                          type: "variable",
                          data: {
                            value: "{topic}",
                            $sourceId: "3",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "{topic}",
                              marks: [],
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: " britishSubscribers",
                          marks: [],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "567f733b-fdd5-431a-8d3f-7090a4f7fdd8",
            type: "list",
          },
        ],
        channels: [],
      },
    });
  });
});
