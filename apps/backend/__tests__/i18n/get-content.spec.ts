import { transformResponse } from "~/api/notifications/content/transforms/get";
import { BlockWire, IChannel } from "~/types.api";

describe("locales", () => {
  it("will handle text blocks to courier html", () => {
    const block: BlockWire = {
      config:
        '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Hello ","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"inline","type":"variable","data":{"value":"{firstName}"},"nodes":[{"object":"text","text":"{firstName}","marks":[{"object":"mark","type":"bold","data":{}}]}]},{"object":"text","text":",\\n\\n","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":"How is your ","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"inline","type":"highlight","data":{"color":"#FFCC58","brandColors":false},"nodes":[{"object":"text","text":"day","marks":[{"object":"mark","type":"underlined","data":{}},{"object":"mark","type":"textColor","data":{"color":"#24AF9C","brandColors":false}}]}]},{"object":"text","text":"?\\n\\n","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"text","text":"I hope it is ","marks":[]},{"object":"text","text":"well","marks":[{"object":"mark","type":"italic","data":{}},{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":" ","marks":[{"object":"mark","type":"italic","data":{}}]},{"object":"text","text":":)\\n\\nClick ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://www.courier.com","text":"Here","disableLinkTracking":false},"nodes":[{"object":"text","text":"Here","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}},"align":"left"}',
      id: "71d52c7a-a50f-4de3-9d18-907310e996a4",
      type: "text",
    };

    const apiResponse = transformResponse({
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
    });

    expect(apiResponse).toEqual({
      blocks: [
        {
          alias: undefined,
          context: undefined,
          content:
            '<strong>Hello </strong><variable id="3"><strong>{firstName}</strong></variable><strong>,<br/><br/></strong><u>How is your </u><highlight id="7"><text-color parent-id="8"><u>day</u></text-color></highlight><u>?<br/><br/></u>I hope it is <strong><em>well</em></strong><em> </em>:)<br/><br/>Click <a id="14">Here</a>',
          id: "block_71d52c7a-a50f-4de3-9d18-907310e996a4",
          type: "text",
          checksum: "b5676f1242fb1cceccf4f59535c0254f",
        },
      ],
      channels: [],
      checksum: "95a947140530d97b58365a816dde09ef",
    });
  });

  it("will handle action blocks to courier html", () => {
    const block: BlockWire = {
      config:
        '{"align":"center","backgroundColor":"{brand.colors.primary}","href":"https://www.courier.com","style":"link","text":"Yo Action","disableLinkTracking":false}',
      id: "e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
      type: "action",
    };

    const apiResponse = transformResponse({
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
    });

    expect(apiResponse).toEqual({
      blocks: [
        {
          alias: undefined,
          context: undefined,
          content: "Yo Action",
          id: "block_e3afd6a4-2143-4727-8dda-1b1ff749cfa0",
          type: "action",
          checksum: "ccfcb0a1e41f8dcdd3c45d51bc0e171a",
        },
      ],
      channels: [],
      checksum: "c20fff70782e0a9508a957f4163ce1b9",
    });
  });

  it("will handle template blocks to courier html", () => {
    const block: BlockWire = {
      config: '{"template":"<div>Hello World</div>"}',
      id: "4a75e572-1ce5-439f-9409-cd7def5478d8",
      type: "template",
    };

    const apiResponse = transformResponse({
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
    });

    expect(apiResponse).toEqual({
      blocks: [
        {
          alias: undefined,
          context: undefined,
          content: "<div>Hello World</div>",
          id: "block_4a75e572-1ce5-439f-9409-cd7def5478d8",
          type: "template",
          checksum: "bc5b60ab9f17df06536e600d6426881f",
        },
      ],
      channels: [],
      checksum: "1269adc0888a431252fb601552a5741c",
    });
  });

  it("will handle list blocks to courier html", () => {
    const block: BlockWire = {
      config:
        '{"child":{"imageHref":"","imagePath":"","path":"","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Daredevil is awesome","marks":[]}]}]}}},"top":{"background":"#4C4C4C","imageHref":"","imagePath":"","path":"","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Marvel superheroes","marks":[]}]}]}}},"useChildren":true,"useImages":false}',
      id: "a7922e91-b714-4811-b737-f205254ab253",
      type: "list",
    };

    const apiResponse = transformResponse({
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
    });

    expect(apiResponse).toEqual({
      blocks: [
        {
          alias: undefined,
          context: undefined,
          content: {
            children: "Daredevil is awesome",
            parent: "Marvel superheroes",
          },
          id: "block_a7922e91-b714-4811-b737-f205254ab253",
          type: "list",
          checksum: "28b5b63e9880f0f3428ae003b5957f52",
        },
      ],
      channels: [],
      checksum: "16029094c9b0cc04e35ebb0f2d67a975",
    });
  });

  it("will handle channels", () => {
    const channel: IChannel = {
      blockIds: [],
      config: {
        email: {
          emailSubject: "hello there",
        },
      },
      id: "0d69a46a-2263-4c51-91fa-47817664c88a",
      providers: [],
      taxonomy: "",
    };
    const apiResponse = transformResponse({
      id: "123",
      tenantId: "mockTenantId",
      created: 123,
      creator: "riley",
      objtype: "notification-draft",
      title: "My Template",
      json: {
        channels: {
          bestOf: [channel],
          always: [],
        },
        blocks: [],
      },
    });

    expect(apiResponse).toEqual({
      blocks: [],
      channels: [
        {
          id: "channel_0d69a46a-2263-4c51-91fa-47817664c88a",
          content: {
            subject: "hello there",
            title: undefined,
          },
          checksum: "55f3a9747deab5bcfd1586ed5b4f89ba",
          type: "email",
        },
      ],
      checksum: "1b9de1a8aca08aae2dbaaec1a9556fa4",
    });
  });
});
