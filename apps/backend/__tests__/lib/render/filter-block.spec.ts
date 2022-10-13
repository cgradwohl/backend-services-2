import getProviderTemplate from "~/handlebars/template";
import getBlocks from "~/lib/blocks";
import createLinkHandler from "~/lib/link-handler";
import renderPlain from "~/lib/render/plain";
import createVariableHandler from "~/lib/variable-handler";
import { DeliveryHandlerParams } from "~/providers/types";
import {
  BlockType,
  ConditionalFilterOperator,
  IActionBlockConfig,
} from "~/types.api";

const mockConfig = {
  provider: "mailjet",
};
const mockButtonText = "Mock Button Text";
const mockButtonHref = "https://mockbuttonhref.com";

const mockBlockConfig: IActionBlockConfig = {
  align: "center",
  backgroundColor: "#424242",
  conditional: {
    filters: [
      {
        operator: "EQUALS",
        property: "company",
        source: "data",
        value: "MoveWith",
      },
    ],
  },
  href: mockButtonHref,
  style: "button",
  text: mockButtonText,
};

const mockVariableData = {
  data: {},
  event: "mockEvent",
  profile: {},
  recipient: "riley@courier.com",
};
const mockLinkHandler = createLinkHandler({});
const mockVariableHandler = createVariableHandler({
  value: mockVariableData,
}).getScoped("data");

const mockBlock = {
  config: JSON.stringify({}),
  id: "mockId",
  type: "action" as BlockType,
};

const mockParams: any = {
  config: mockConfig,
  profile: mockVariableData.profile,
  variableHandler: mockVariableHandler,
};

const helperGetBlockWithConfig = (
  config: IActionBlockConfig,
  params: DeliveryHandlerParams
) => {
  return getBlocks(
    [
      {
        ...mockBlock,
        config: JSON.stringify(config),
      },
    ],
    mockLinkHandler,
    params.variableHandler
  );
};

describe("filterBlock", () => {
  it("should not filter if exception is thrown", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        hello: "world",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "BAD OPERATOR" as ConditionalFilterOperator,
              property: "hello",
              source: "data",
              value: "EQUALS",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual(
      "Mock Button Text: https://mockbuttonhref.com"
    );
  });

  it("should work with JSONPath", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        companies: [
          {
            name: "EQUALS",
          },
        ],
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "EQUALS",
              property: "$.data.companies[0].name",
              source: "data",
              value: "EQUALS",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'equals'", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        company: "MoveWith",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "EQUALS",
              property: "company",
              source: "data",
              value: "MoveWith",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'equals' with numbers", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        companySize: 100,
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "EQUALS",
              property: "companySize",
              source: "data",
              value: "100",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'not equals'", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        company: "MoveWith",
      },
    };

    const params = {
      ...mockParams,
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_EQUALS",
              property: "company",
              source: "data",
              value: "NOT EQUALS",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is greater than'", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        size: 100,
      },
    };

    const params = {
      ...mockParams,
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "GREATER_THAN",
              property: "size",
              source: "data",
              value: "1",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is less than'", () => {
    const variableData = {
      ...mockVariableData,
      data: {
        size: 100,
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "LESS_THAN",
              property: "size",
              source: "data",
              value: "500",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is greater than or equals'", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        size: 100,
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "GREATER_THAN_EQUALS",
              property: "size",
              source: "data",
              value: "100",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is less than or equals'", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        size: 100,
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "LESS_THAN_EQUALS",
              property: "size",
              source: "data",
              value: "100",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'contains'", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "Hi, I'm from Minnesota",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "CONTAINS",
              property: "state",
              source: "data",
              value: "Minnesota",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'contains' with array", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: ["one", "two"],
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "CONTAINS",
              property: "state",
              source: "data",
              value: "two",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'contains' and handle variable not found", async () => {
    const variableData = {
      ...mockVariableData,
      data: {},
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "CONTAINS",
              property: "state",
              source: "aValueThatDoesntExist",
              value: "Minnesota",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual(
      "Mock Button Text: https://mockbuttonhref.com"
    );
  });

  it("should respect blockConfig.conditional.operator 'does not contain' with arrays", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: ["one", "two"],
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_CONTAINS",
              property: "state",
              source: "data",
              value: "three",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'does not contain'", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "Hi, I'm from Minnesota",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_CONTAINS",
              property: "state",
              source: "data",
              value: "California",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is empty' when value is falsy", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: false,
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableData,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "IS_EMPTY",
              property: "state",
              source: "data",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual(
      "Mock Button Text: https://mockbuttonhref.com"
    );
  });

  it("should respect blockConfig.conditional.operator 'does not contain' and handle variable not found", async () => {
    const variableData = {
      ...mockVariableData,
      data: {},
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_CONTAINS",
              property: "state",
              source: "aValueThatDoesntExist",
              value: "Minnesota",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is empty'", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "IS_EMPTY",
              property: "state",
              source: "data",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect blockConfig.conditional.operator 'is not empty'", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "NOT EMPTY",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_EMPTY",
              property: "state",
              source: "data",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should respect check the entire array of conditionals with AND", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "NOT EMPTY",
      },
      profile: {
        email: "mock@email.com",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_EMPTY",
              property: "state",
              source: "data",
            },
            {
              operator: "EQUALS",
              property: "state",
              source: "data",
              value: "NOT EMPTY",
            },
            {
              operator: "EQUALS",
              property: "email",
              source: "profile",
              value: "mock@email.com",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should fail if one conditional doesn't match", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "NOT EMPTY",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_EMPTY",
              property: "state",
              source: "data",
            },
            {
              operator: "EQUALS",
              property: "state",
              source: "data",
              value: "NOT EMPTY!!",
            },
            {
              operator: "EQUALS",
              property: "email",
              source: "profile",
              value: "mock@email.com",
            },
          ],
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual(
      "Mock Button Text: https://mockbuttonhref.com"
    );
  });

  it("should pass if one conditional matches with logicalOperator === OR", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "NOT EMPTY",
      },
      profile: {
        email: "mock@email.com",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "NOT_EMPTY",
              property: "state",
              source: "data",
            },
            {
              operator: "EQUALS",
              property: "state",
              source: "data",
              value: "NOT EMPTY!!",
            },
            {
              operator: "EQUALS",
              property: "email",
              source: "profile",
              value: "mock@email.com",
            },
          ],
          logicalOperator: "or",
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual("");
  });

  it("should fail if no conditional matches with logicalOperator === OR", async () => {
    const variableData = {
      ...mockVariableData,
      data: {
        state: "NOT EMPTY",
      },
      profile: {
        email: "bad@email.com",
      },
    };

    const params: DeliveryHandlerParams = {
      ...mockParams,
      variableHandler: createVariableHandler({ value: variableData }).getScoped(
        "data"
      ),
    };

    const blocks = helperGetBlockWithConfig(
      {
        ...mockBlockConfig,
        conditional: {
          filters: [
            {
              operator: "IS_EMPTY",
              property: "state",
              source: "data",
            },
            {
              operator: "EQUALS",
              property: "state",
              source: "data",
              value: "NOT EMPTY!!",
            },
            {
              operator: "EQUALS",
              property: "email",
              source: "profile",
              value: "mock123@email.com",
            },
          ],
          logicalOperator: "or",
        },
      },
      params
    );

    const result = renderPlain(blocks, params);
    expect(result.plain).toEqual(
      "Mock Button Text: https://mockbuttonhref.com"
    );
  });
});
