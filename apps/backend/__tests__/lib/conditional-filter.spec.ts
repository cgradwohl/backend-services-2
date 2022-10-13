import shouldFilter from "~/lib/conditional-filter";
import createVariableHandler from "~/lib/variable-handler";
import { IConditionalConfig } from "~/types.api";

describe("conditional filter", () => {
  const variableMockData = {
    brand: {
      colors: {},
      id:
        "c829c14b-bf42-4e2d-87cb-6b655c942bbd/version/2021-02-06T02:17:58.251Z",
    },
    data: {
      senderId: "suhas-dev",
    },
    event: "KR9W7AS2W1MM6TN94GCFWFKFZPMK",
    messageId: "1-60341692-4b45758f4b10c02907a20923",
    profile: {
      discord: {
        channel_id: "805643317190590515",
      },
    },
    recipient: "suhas-dev",
  };

  const mockCondition: IConditionalConfig = {
    behavior: "hide",
    filters: [
      {
        id: "61323820-dc1a-4884-9dcc-9c05a9fb944c",
        operator: "EQUALS",
        property: "senderId",
        source: "data",
        value: "$.recipient",
      },
    ],
    logicalOperator: "and",
  };

  it("should filter based on condition", () => {
    const mockVariableHandler = createVariableHandler({
      value: variableMockData,
    });

    expect(shouldFilter(mockVariableHandler, mockCondition)).toBe(true);
  });
});
