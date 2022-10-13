import validateFn from "~/audiences/util/validate";

describe("validate", () => {
  afterEach(() => {
    validateFn.errors = [];
  });

  test("should validate filter", () => {
    const body = {
      filter: {
        operator: "AND",
        path: "profile.locale",
        value: "en-US",
      },
    };
    expect(validateFn(body)).toBe(true);
  });

  test("should validate nested filter", () => {
    const body = {
      filter: {
        operator: "AND",
        filters: [
          {
            operator: "OR",
            filters: [
              {
                operator: "EQ",
                path: "profile.locale",
                value: "en-US",
              },
              {
                operator: "EQ",
                path: "profile.title",
                value: "Software Engineer",
              },
            ],
          },
        ],
      },
    };

    expect(validateFn(body)).toBe(true);
  });

  test("should give errors if operator is invalid", () => {
    const invalidBody = {
      filter: {
        operator: "INVALID_OPERATOR",
        path: "profile.locale",
        value: "en-US",
      },
    };
    const validationResult = validateFn(invalidBody);
    expect(validationResult).toBe(false);
  });

  test("should give errors when single  nested rule specified", () => {
    const invalidBody = {
      filter: {
        operator: "AND",
        path: "profile.locale",
        value: "en-US",
        filters: [
          {
            operator: "EQ",
            value: "Software Engineer",
            path: "profile.title",
          },
        ],
      },
    };
    const validationResult = validateFn(invalidBody);
    expect(validationResult).toBe(false);
  });
});
