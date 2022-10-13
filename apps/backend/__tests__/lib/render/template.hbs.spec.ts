import getUnixTime from "date-fns/getUnixTime";
import parseISO from "date-fns/parseISO";
import getBlocks from "~/lib/blocks";
import createLinkHandler from "~/lib/link-handler";
import renderEmail from "~/lib/render/email";
import createVariableHandler from "~/lib/variable-handler";

const mockVariableData = {
  data: {},
  event: "mockEvent",
  profile: {
    email: "riley@courier.com",
  },
  recipient: "riley@courier.com",
};

const mockParams: any = {
  emailTemplateConfig: {},
  isUsingTemplateOverride: true,
  linkHandler: createLinkHandler({}),
  variableHandler: createVariableHandler({ value: mockVariableData }),
};

describe("handlebars template", () => {
  it("should super basic", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        name: "World",
      },
    };
    const newParams: any = {
      ...mockParams,
      templateOverride: "<div>Hello {{name}}</div>",
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const templates = renderEmail([], newParams);
    expect(templates.html).toEqual("<div>Hello World</div>");
  });

  it("should handle an invalid template", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        name: "World",
      },
    };
    const newParams: any = {
      ...mockParams,
      templateOverride: "<div>Hello {{name}</div>",
      variableHandler: createVariableHandler({ value: variableData }),
    };

    const templates = renderEmail([], newParams);
    expect(templates.html.includes("Error Rendering Template")).toEqual(true);
  });

  it("should work with {{path}} helper", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        companies: [{ name: "World" }],
      },
    };

    const newParams = {
      ...mockParams,
      templateOverride: "<div>Hello {{path '$.data.companies[0].name'}}</div>",
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const templates = renderEmail([], newParams);
    expect(templates.html).toEqual("<div>Hello World</div>");
  });

  it("should work with {{profile}} helper", () => {
    const variableData = {
      ...mockVariableData,
      profile: {
        name: "World",
      },
    };

    const newParams = {
      ...mockParams,
      templateOverride: "<div>Hello {{profile 'name'}}</div>",
      variableData,
      variableHandler: createVariableHandler({ value: variableData }),
    };

    const templates = renderEmail([], newParams);
    expect(templates.html).toEqual("<div>Hello World</div>");
  });

  it("should be able to target profile", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        companies: [{ name: "World" }],
      },
    };

    const newPayload = {
      ...mockParams,
      templateOverride: "<div>Hello {{profile 'email'}}</div>",
      variableData,
      variableHandler: createVariableHandler({ value: variableData }),
    };

    const templates = renderEmail([], newPayload);
    expect(templates.html).toEqual("<div>Hello riley@courier.com</div>");
  });

  it("should ignore template override if its empty", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        company: "MoveWith",
        people: [],
        role: "VP Sales",
      },
    };

    const params = {
      ...mockParams,
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const mockBlocks = getBlocks(
      [
        {
          config:
            '{"value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Search results for ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{role}"},"nodes":[{"object":"text","text":"{role}","marks":[{"object":"mark","type":"bold","data":{}}]}]},{"object":"text","text":" at ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{company}:"},"nodes":[{"object":"text","text":"{company}","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":":","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}}}',
          id: "c502ffbf-4c12-4dc6-83ad-9c0e5805c6ad",
          type: "text",
        },
      ],
      params.linkHandler,
      params.variableHandler
    );

    const result = await renderEmail(mockBlocks, params);

    expect(result.text).toEqual("Search results for VP Sales at MoveWith:");
  });

  describe("sendwithus helpers", () => {
    it("should support datetimeformat", () => {
      const iso = parseISO("2015-02-17T18:30:20.000Z");
      const time = iso.getTime();

      const newParams = {
        ...mockParams,
        templateOverride: `<div>{{swu_datetimeformat ${time} "%a, %B %d"}}</div>`,
      };

      const templates = renderEmail([], newParams);
      expect(templates.html).toEqual("<div>Tue, February 17</div>");
    });

    it("should support iso8601_to_time", () => {
      const iso = "2015-02-17T18:30:20.000Z";

      const newParams = {
        ...mockParams,
        templateOverride: `<div>{{swu_iso8601_to_time "${iso}"}}</div>`,
      };

      const templates = renderEmail([], newParams);
      expect(templates.html).toEqual("<div>1424197820000</div>");
    });

    it("should support timestamp_to_time", () => {
      const unix = getUnixTime(parseISO("2015-02-17T18:30:20.000Z"));

      const newParams = {
        ...mockParams,
        templateOverride: `<div>{{swu_timestamp_to_time ${unix}}}</div>`,
      };

      const templates = renderEmail([], newParams);
      expect(templates.html).toEqual("<div>1424197820000</div>");
    });

    it("should handle nested helpers", () => {
      const newParams = {
        ...mockParams,
        templateOverride: `<div>{{ swu_datetimeformat (swu_iso8601_to_time '2015-02-17T18:30:20.000Z') '%b %d, %Y' }}</div>`,
      };

      const templates = renderEmail([], newParams);
      expect(templates.html).toEqual("<div>Feb 17, 2015</div>");
    });
  });
});
