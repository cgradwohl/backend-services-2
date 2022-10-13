import { transformRequest } from "~/api/notifications/locales/transforms/post";
import { BlockWire } from "~/types.api";

describe("post locales", () => {
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
      [
        {
          id: "block_71d52c7a-a50f-4de3-9d18-907310e996a4",
          type: "text",
          locales: {
            "eu-fr":
              '<strong>Bonjour </strong><variable id="3"><strong>{firstName}</strong></variable><strong>,<br/><br/></strong><u>Comment se passe ta </u><highlight id="7"><text-color parent-id="8"><u>journée</u></text-color></highlight><u>?<br/><br/></u>J\'espère que c\'est <strong><em>bien</em></strong><em> </em>:)<br/><br/>Cliquez <a id="14">Ici</a>',
          },
        },
      ],
      [
        {
          id: "456",
          locales: {
            "eu-fr": {
              subject: "foo",
            },
          },
        },
      ]
    );

    expect(templateLocales).toEqual({
      "eu-fr": {
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
      [
        {
          id: "block_e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
          type: "action",
          locales: {
            "eu-fr": "Updated french action block",
          },
        },
      ],
      [
        {
          id: "456",
          locales: {
            "eu-fr": {
              subject: "foo",
            },
          },
        },
      ]
    );

    expect(templateLocales).toEqual({
      "eu-fr": {
        blocks: [
          {
            id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
            type: "action",
            content: "Updated french action block",
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
      [
        {
          id: "block_4a75e572-1ce5-439f-9409-cd7def5478d8",
          type: "template",
          locales: {
            "eu-fr": "<div>French World</div>",
          },
        },
      ],
      [
        {
          id: "456",
          locales: {
            "eu-fr": {
              subject: "foo",
            },
          },
        },
      ]
    );

    expect(templateLocales).toEqual({
      "eu-fr": {
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
      [
        {
          id: "block_a7922e91-b714-4811-b737-f205254ab253",
          type: "list",
          locales: {
            "eu-fr": {
              children:
                "cool in french<br/><br/>French Punisher<br/><br/>something totally random<br/><br/><br/><br/>ndjkasnilsadnlsadnads<br/><br/><br/>jlasdnjasndlsd",
              parent:
                "super cool in French Marvel<br/><br/><br/><br/><br/>the frenchOfGreat marvel <strong>french stuff</strong>",
            },
          },
        },
      ],
      [
        {
          id: "456",
          locales: {
            "eu-fr": {
              subject: "foo",
            },
          },
        },
      ]
    );

    expect(templateLocales).toEqual({
      "eu-fr": {
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
});
