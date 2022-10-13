import assertHasCapability from "~/lib/access-control/assert-has-capability";
import {
  Action,
  IPolicyStatement,
  WildcardAction,
} from "~/lib/access-control/types";

describe("ALLOW", () => {
  [
    {
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:ReadItem"],
          effect: "ALLOW",
          resources: ["production/12345"],
        },
      ] as IPolicyStatement[],
    },
    {
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:ReadItem"],
          effect: "ALLOW",
          resources: ["*"],
        },
      ] as IPolicyStatement[],
    },
    {
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:*"],
          effect: "ALLOW",
          resources: ["*"],
        },
      ] as IPolicyStatement[],
    },
    {
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:ReadItem"],
          effect: "ALLOW",
          resources: ["production/*"],
        },
      ] as IPolicyStatement[],
    },
  ].forEach(({ requestedAction, requestedResource, statements }, index) => {
    it(`should ALLOW test case ${index}`, () => {
      expect(() => {
        assertHasCapability(
          {
            key: "",
            policies: [
              {
                statements,
                version: "2020-11-09",
              },
            ],
          },
          requestedAction as Action | WildcardAction,
          requestedResource
        );
      }).not.toThrow();
    });
  });
});

describe("DENY", () => {
  [
    {
      error: "Explicit Deny",
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:ReadItem"],
          effect: "DENY",
          resources: ["production/12345"],
        },
      ] as IPolicyStatement[],
    },
    {
      error: "Explicit Deny",
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:ReadItem"],
          effect: "DENY",
          resources: ["*"],
        },
      ] as IPolicyStatement[],
    },
    {
      error: "Explicit Deny",
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [
        {
          actions: ["brand:*"],
          effect: "DENY",
          resources: ["*"],
        },
      ] as IPolicyStatement[],
    },
    {
      error: "No matching policy found",
      requestedAction: "brand:ReadItem",
      requestedResource: "production/12345",
      statements: [],
    },
  ].forEach(
    ({ error, requestedAction, requestedResource, statements }, index) => {
      it(`should DENY test case ${index}`, () => {
        expect(() => {
          assertHasCapability(
            {
              key: "",
              policies: [
                {
                  statements,
                  version: "2020-11-09",
                },
              ],
            },
            requestedAction as Action | WildcardAction,
            requestedResource
          );
        }).toThrowError(error);
      });
    }
  );
});
