import { transformRequest } from "~/api/notifications/locales/transforms/put";
import { BlockWire } from "~/types.api";

describe("put locales", () => {
  it("will creating slate from html", () => {
    const block: BlockWire = {
      config:
        '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Hello ","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"inline","type":"variable","data":{"value":"{firstName}"},"nodes":[{"object":"text","text":"{firstName}","marks":[{"object":"mark","type":"bold","data":{}}]}]},{"object":"text","text":",\\n\\n","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":"How is your ","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"inline","type":"highlight","data":{"color":"#FFCC58","brandColors":false},"nodes":[{"object":"text","text":"day","marks":[{"object":"mark","type":"underlined","data":{}},{"object":"mark","type":"textColor","data":{"color":"#24AF9C","brandColors":false}}]}]},{"object":"text","text":"?\\n\\n","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"text","text":"I hope it is ","marks":[]},{"object":"text","text":"well","marks":[{"object":"mark","type":"italic","data":{}},{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":" ","marks":[{"object":"mark","type":"italic","data":{}}]},{"object":"text","text":":)\\n\\nClick ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://www.courier.com","text":"Here","disableLinkTracking":false},"nodes":[{"object":"text","text":"Here","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}},"align":"left"}',
      id: "71d52c7a-a50f-4de3-9d18-907310e996a4",
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
      "fr_FR",
      {
        it_IT: {
          blocks: [
            {
              id: "71d52c7a-a50f-4de3-9d18-907310e996a4",
              type: "text",
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
                          text: "Italian Bonjour ",
                          marks: [
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "inline",
                          type: "variable",
                          data: {
                            $sourceId: "3",
                            value: "{firstName}",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "{firstName}",
                              marks: [
                                {
                                  object: "mark",
                                  type: "bold",
                                  data: {},
                                },
                              ],
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: ",",
                          marks: [
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "Comment se passe ta ",
                          marks: [
                            {
                              object: "mark",
                              type: "underlined",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "inline",
                          type: "highlight",
                          data: {
                            brandColors: false,
                            color: "#FFCC58",
                            $sourceId: "7",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "journée",
                              marks: [
                                {
                                  object: "mark",
                                  type: "underlined",
                                  data: {},
                                },
                                {
                                  object: "mark",
                                  type: "textColor",
                                  data: {
                                    brandColors: false,
                                    color: "#24AF9C",
                                    $sourceParentId: "8",
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "?",
                          marks: [
                            {
                              object: "mark",
                              type: "underlined",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [
                            {
                              object: "mark",
                              type: "underlined",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [
                            {
                              object: "mark",
                              type: "underlined",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: "J'espère que c'est ",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "bien",
                          marks: [
                            {
                              object: "mark",
                              type: "italic",
                              data: {},
                            },
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: " ",
                          marks: [
                            {
                              object: "mark",
                              type: "italic",
                              data: {},
                            },
                          ],
                        },
                        {
                          object: "text",
                          text: ":)",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "Cliquez ",
                          marks: [],
                        },
                        {
                          object: "inline",
                          type: "link",
                          data: {
                            disableLinkTracking: false,
                            href: "https://www.courier.com",
                            text: "Here",
                            $sourceId: "14",
                          },
                          nodes: [
                            {
                              object: "text",
                              text: "Ici",
                              marks: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          channels: [],
        },
      },
      [
        {
          id: "block_71d52c7a-a50f-4de3-9d18-907310e996a4",
          content:
            '<strong>Bonjour </strong><variable id="3"><strong>{firstName}</strong></variable><strong>,<br/><br/></strong><u>Comment se passe ta </u><highlight id="7"><text-color parent-id="8"><u>journée</u></text-color></highlight><u>?<br/><br/></u>J\'espère que c\'est <strong><em>bien</em></strong><em> </em>:)<br/><br/>Cliquez <a id="14">Ici</a>',
        },
      ],
      []
    );

    expect(templateLocales).toEqual({
      fr_FR: {
        blocks: [
          {
            id: "71d52c7a-a50f-4de3-9d18-907310e996a4",
            type: "text",
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
                        text: "Bonjour ",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "inline",
                        type: "variable",
                        data: {
                          $sourceId: "3",
                          value: "{firstName}",
                        },
                        nodes: [
                          {
                            object: "text",
                            text: "{firstName}",
                            marks: [
                              {
                                object: "mark",
                                type: "bold",
                                data: {},
                              },
                            ],
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: ",",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "Comment se passe ta ",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "inline",
                        type: "highlight",
                        data: {
                          brandColors: false,
                          color: "#FFCC58",
                          $sourceId: "7",
                        },
                        nodes: [
                          {
                            object: "text",
                            text: "journée",
                            marks: [
                              {
                                object: "mark",
                                type: "underlined",
                                data: {},
                              },
                              {
                                object: "mark",
                                type: "textColor",
                                data: {
                                  brandColors: false,
                                  color: "#24AF9C",
                                  $sourceParentId: "8",
                                },
                              },
                            ],
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "?",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "J'espère que c'est ",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "bien",
                        marks: [
                          {
                            object: "mark",
                            type: "italic",
                            data: {},
                          },
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: " ",
                        marks: [
                          {
                            object: "mark",
                            type: "italic",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: ":)",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "Cliquez ",
                        marks: [],
                      },
                      {
                        object: "inline",
                        type: "link",
                        data: {
                          disableLinkTracking: false,
                          href: "https://www.courier.com",
                          text: "Here",
                          $sourceId: "14",
                        },
                        nodes: [
                          {
                            object: "text",
                            text: "Ici",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        channels: [],
      },
      it_IT: {
        blocks: [
          {
            id: "71d52c7a-a50f-4de3-9d18-907310e996a4",
            type: "text",
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
                        text: "Italian Bonjour ",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "inline",
                        type: "variable",
                        data: {
                          $sourceId: "3",
                          value: "{firstName}",
                        },
                        nodes: [
                          {
                            object: "text",
                            text: "{firstName}",
                            marks: [
                              {
                                object: "mark",
                                type: "bold",
                                data: {},
                              },
                            ],
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: ",",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "Comment se passe ta ",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "inline",
                        type: "highlight",
                        data: {
                          brandColors: false,
                          color: "#FFCC58",
                          $sourceId: "7",
                        },
                        nodes: [
                          {
                            object: "text",
                            text: "journée",
                            marks: [
                              {
                                object: "mark",
                                type: "underlined",
                                data: {},
                              },
                              {
                                object: "mark",
                                type: "textColor",
                                data: {
                                  brandColors: false,
                                  color: "#24AF9C",
                                  $sourceParentId: "8",
                                },
                              },
                            ],
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "?",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [
                          {
                            object: "mark",
                            type: "underlined",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: "J'espère que c'est ",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "bien",
                        marks: [
                          {
                            object: "mark",
                            type: "italic",
                            data: {},
                          },
                          {
                            object: "mark",
                            type: "bold",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: " ",
                        marks: [
                          {
                            object: "mark",
                            type: "italic",
                            data: {},
                          },
                        ],
                      },
                      {
                        object: "text",
                        text: ":)",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "\n",
                        marks: [],
                      },
                      {
                        object: "text",
                        text: "Cliquez ",
                        marks: [],
                      },
                      {
                        object: "inline",
                        type: "link",
                        data: {
                          disableLinkTracking: false,
                          href: "https://www.courier.com",
                          text: "Here",
                          $sourceId: "14",
                        },
                        nodes: [
                          {
                            object: "text",
                            text: "Ici",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        channels: [],
      },
    });
  });

  it("will update action block", () => {
    const block: BlockWire = {
      config:
        '{"align":"center","backgroundColor":"{brand.colors.primary}","href":"https://www.courier.com","style":"link","text":"Yo Action","disableLinkTracking":false}',
      id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
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
      "fr_FR",
      {
        it_IT: {
          blocks: [
            {
              id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
              type: "action",
              content: "Updated italian action block",
            },
          ],
          channels: [],
        },
      },
      [
        {
          id: "block_e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
          content: "Updated French action block",
        },
      ],
      []
    );

    expect(templateLocales).toEqual({
      it_IT: {
        blocks: [
          {
            id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
            type: "action",
            content: "Updated italian action block",
          },
        ],
        channels: [],
      },
      fr_FR: {
        blocks: [
          {
            id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
            type: "action",
            content: "Updated French action block",
          },
        ],
        channels: [],
      },
    });
  });

  it("will update template block", () => {
    const block: BlockWire = {
      config: '{"template":"<div>Hello World</div>"}',
      id: "4a75e572-1ce5-439f-9409-cd7def5478d8",
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
      "fr_FR",
      {
        it_IT: {
          blocks: [
            {
              id: "4a75e572-1ce5-439f-9409-cd7def5478d8",
              type: "template",
              content: "<div>Italian World</div>",
            },
          ],
          channels: [],
        },
      },
      [
        {
          id: "block_4a75e572-1ce5-439f-9409-cd7def5478d8",
          content: "<div>French World</div>",
        },
      ],
      []
    );

    expect(templateLocales).toEqual({
      it_IT: {
        blocks: [
          {
            id: "4a75e572-1ce5-439f-9409-cd7def5478d8",
            type: "template",
            content: "<div>Italian World</div>",
          },
        ],
        channels: [],
      },
      fr_FR: {
        blocks: [
          {
            id: "4a75e572-1ce5-439f-9409-cd7def5478d8",
            type: "template",
            content: "<div>French World</div>",
          },
        ],
        channels: [],
      },
    });
  });

  it("will update list block", () => {
    const block: BlockWire = {
      config:
        '{"child":{"imageHref":"","imagePath":"","path":"","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Daredevil is awesome","marks":[]}]}]}}},"top":{"background":"#4C4C4C","imageHref":"","imagePath":"","path":"","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Marvel superheroes","marks":[]}]}]}}},"useChildren":true,"useImages":false}',
      id: "a7922e91-b714-4811-b737-f205254ab253",
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
      "fr_FR",
      {
        it_IT: {
          blocks: [
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
                            object: "text",
                            text: "cool in french",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "French Punisher",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "something totally random",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "ndjkasnilsadnlsadnads",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "jlasdnjasndlsd",
                            marks: [],
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
                            object: "text",
                            text: "super cool in French Marvel",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "\n",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "the frenchOfGreat marvel ",
                            marks: [],
                          },
                          {
                            object: "text",
                            text: "french stuff",
                            marks: [
                              {
                                object: "mark",
                                type: "bold",
                                data: {},
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              id: "a7922e91-b714-4811-b737-f205254ab253",
              type: "list",
            },
          ],
          channels: [],
        },
      },
      [
        {
          id: "block_a7922e91-b714-4811-b737-f205254ab253",
          content: {
            children:
              "cool in french<br/><br/>French Punisher<br/><br/>something totally random<br/><br/><br/><br/>ndjkasnilsadnlsadnads<br/><br/><br/>jlasdnjasndlsd",
            parent:
              "super cool in French Marvel<br/><br/><br/><br/><br/>the frenchOfGreat marvel <strong>french stuff</strong>",
          },
        },
      ],
      []
    );

    expect(templateLocales).toEqual({
      it_IT: {
        blocks: [
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
                          object: "text",
                          text: "cool in french",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "French Punisher",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "something totally random",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "ndjkasnilsadnlsadnads",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "jlasdnjasndlsd",
                          marks: [],
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
                          object: "text",
                          text: "super cool in French Marvel",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "the frenchOfGreat marvel ",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "french stuff",
                          marks: [
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "a7922e91-b714-4811-b737-f205254ab253",
            type: "list",
          },
        ],
        channels: [],
      },
      fr_FR: {
        blocks: [
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
                          object: "text",
                          text: "cool in french",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "French Punisher",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "something totally random",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "ndjkasnilsadnlsadnads",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "jlasdnjasndlsd",
                          marks: [],
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
                          object: "text",
                          text: "super cool in French Marvel",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "\n",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "the frenchOfGreat marvel ",
                          marks: [],
                        },
                        {
                          object: "text",
                          text: "french stuff",
                          marks: [
                            {
                              object: "mark",
                              type: "bold",
                              data: {},
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            id: "a7922e91-b714-4811-b737-f205254ab253",
            type: "list",
          },
        ],
        channels: [],
      },
    });
  });

  it("will update email channel", () => {
    const block: BlockWire = {
      config:
        '{"align":"center","backgroundColor":"{brand.colors.primary}","href":"https://www.courier.com","style":"link","text":"Yo Action","disableLinkTracking":false}',
      id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
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
            bestOf: [
              {
                blockIds: ["e3afd6a4-2143-4727-8dda-1b1ff749cfa0"],
                config: {
                  email: {
                    emailSubject: "English Subject",

                    emailTemplateConfig: {
                      templateName: "line",

                      topBarColor: "#9D3789",
                    },
                  },

                  locales: {},
                },

                id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",

                providers: [
                  {
                    configurationId: "eaf38bb9-9121-4b39-ad64-119371e2cc5d",

                    key: "sendgrid",
                  },
                ],

                taxonomy: "email:*",

                disabled: false,

                label: "",
              },
            ],
            always: [],
          },
          blocks: [block],
        },
      },
      "fr_FR",
      {
        it_IT: {
          blocks: [
            {
              id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
              type: "action",
              content: "Updated italian action block",
            },
          ],
          channels: [
            {
              id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
              content: {
                subject: "Italian Subject",
              },
            },
          ],
        },
      },
      [],
      [
        {
          id: "channel_a4f9187f-4627-48c2-b822-3e320feb4c5b",
          content: "French Subject",
        },
      ]
    );

    expect(templateLocales).toEqual({
      it_IT: {
        blocks: [
          {
            id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
            type: "action",
            content: "Updated italian action block",
          },
        ],
        channels: [
          {
            content: { subject: "Italian Subject" },
            id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
          },
        ],
      },
      fr_FR: {
        blocks: [],
        channels: [
          {
            content: { subject: "French Subject" },
            id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
          },
        ],
      },
    });
  });

  it("will update push channel", () => {
    const block: BlockWire = {
      config:
        '{"align":"center","backgroundColor":"{brand.colors.primary}","href":"https://www.courier.com","style":"link","text":"Yo Action","disableLinkTracking":false}',
      id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
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
            bestOf: [
              {
                blockIds: ["e3afd6a4-2143-4727-8dda-1b1ff749cfa0"],
                config: {
                  push: {
                    clickAction: "click",
                    icon: "icon",
                    title: "English Title",
                  },

                  locales: {},
                },

                id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",

                providers: [
                  {
                    configurationId: "1bccb631-9bc5-48dc-be54-76e74b8d4df5",

                    key: "pusher",
                  },
                ],

                taxonomy: "push:*",

                disabled: false,

                label: "",
              },
            ],
            always: [],
          },
          blocks: [block],
        },
      },
      "fr_FR",
      {
        it_IT: {
          blocks: [
            {
              id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
              type: "action",
              content: "Updated italian action block",
            },
          ],
          channels: [
            {
              id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
              content: {
                title: "Italian Title",
              },
            },
          ],
        },
      },
      [],
      [
        {
          id: "channel_a4f9187f-4627-48c2-b822-3e320feb4c5b",
          content: "French Title",
        },
      ]
    );

    expect(templateLocales).toEqual({
      it_IT: {
        blocks: [
          {
            id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
            type: "action",
            content: "Updated italian action block",
          },
        ],
        channels: [
          {
            content: { title: "Italian Title" },
            id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
          },
        ],
      },
      fr_FR: {
        blocks: [],
        channels: [
          {
            content: { title: "French Title" },
            id: "a4f9187f-4627-48c2-b822-3e320feb4c5b",
          },
        ],
      },
    });
  });
});
