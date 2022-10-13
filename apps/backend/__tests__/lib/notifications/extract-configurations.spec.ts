import getConfigurationIds from "~/lib/notifications/extract-configurations";
import { INotificationWire, INotificationJsonWire } from "~/types.api";

interface TestCase {
  testCase: INotificationJsonWire;
  expected: Array<string>;
}

describe("workers/prepare/get-configuration-ids", () => {
  const strategies: Array<TestCase> = [
    {
      testCase: {
        blocks: [],
        channels: {
          always: [
            {
              blockIds: [],
              id: "id-1",
              providers: [
                {
                  configurationId: "configuration-1",
                  key: "configuration-1",
                },
              ],
              taxonomy: "taxonomy",
            },
          ],
          bestOf: [
            {
              blockIds: [],
              id: "id-2",
              providers: [
                {
                  configurationId: "configuration-1",
                  key: "configuration-1",
                },
              ],
              taxonomy: "taxonomy",
            },
            {
              blockIds: [],
              id: "id-3",
              providers: [
                {
                  configurationId: "configuration-2",
                  key: "configuration-2",
                },
              ],
              taxonomy: "taxonomy",
            },
          ],
        },
      },
      expected: ["configuration-1", "configuration-2"],
    },
    {
      testCase: {
        blocks: [],
        channels: {
          always: [],
          bestOf: [
            {
              blockIds: [],
              id: "id-1",
              providers: [
                {
                  configurationId: "configuration-1",
                  key: "configuration-1",
                },
              ],
              taxonomy: "taxonomy",
            },
          ],
        },
      },
      expected: ["configuration-1"],
    },
    {
      testCase: {
        blocks: [],
        channels: {
          always: [
            {
              blockIds: [],
              id: "id-1",
              providers: [
                {
                  configurationId: "configuration-1",
                  key: "configuration-1",
                },
              ],
              taxonomy: "taxonomy",
            },
          ],
          bestOf: [],
        },
      },
      expected: ["configuration-1"],
    },
  ];

  strategies.forEach(({ testCase, expected }) => {
    it("should return expected configurations", () => {
      const strategy: INotificationWire = {
        id: "id",
        tenantId: "tenantId",
        objtype: "strategy",
        title: "",
        creator: "creator",
        created: +new Date(),
        json: testCase,
      };
      expect(getConfigurationIds(strategy)).toStrictEqual(expected);
    });
  });
});
