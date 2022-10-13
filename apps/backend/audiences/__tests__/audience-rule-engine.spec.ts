import { evaluateAudienceMembership } from "~/audiences/lib/audience-rule-engine";
import { FilterConfig } from "~/audiences/stores/dynamo/types";

describe("evaluate audience membership", () => {
  it("should return true if the rule is satisfied", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      title: "Software Engineer",
    };
    const filter: FilterConfig = {
      operator: "AND",
      filters: [
        {
          operator: "EQ",
          path: "location.city",
          value: "San Francisco",
        },
        {
          operator: "EQ",
          path: "title",
          value: "Software Engineer",
        },
      ],
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      filter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "EQ('location.city', 'San Francisco') => true",
      "EQ('title', 'Software Engineer') => true",
    ]);
  });
  it("should return false if the rule evaluates to false", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      title: "Software Engineer",
    };
    const filter: FilterConfig = {
      operator: "AND",
      filters: [
        {
          operator: "EQ",
          path: "location.city",
          value: "Oakland",
        },
        {
          operator: "EQ",
          path: "title",
          value: "Software Engineer",
        },
      ],
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      filter,
      profile
    );
    expect(result).toBe(false);
    expect(evaluationPath).toEqual([
      "EQ('location.city', 'Oakland') => false",
      "EQ('title', 'Software Engineer') => true",
    ]);
  });

  it("should evaluate grouped rules", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      title: "Software Engineer",
      country: "US",
      gender: "male",
      favorite_colors: ["Blue", "Green", "Red"],
      age: 30,
    };
    const filter: FilterConfig = {
      operator: "AND",
      filters: [
        {
          operator: "AND",
          filters: [
            {
              operator: "EQ",
              path: "gender",
              value: "male",
            },
            {
              operator: "INCLUDES",
              path: "favorite_colors",
              value: "Green",
            },
            {
              operator: "GTE",
              path: "age",
              value: "30",
            },
          ],
        },
        {
          operator: "EQ",
          path: "title",
          value: "Software Engineer",
        },
      ],
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      filter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "EQ('gender', 'male') => true",
      "INCLUDES('favorite_colors', 'Green') => true",
      "GTE('age', '30') => true",
      "EQ('title', 'Software Engineer') => true",
    ]);
  });

  it("should handle incomplete profiles", () => {
    const profile = {};

    const filter: FilterConfig = {
      operator: "EQ",
      value: "San Francisco",
      path: "location.city",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      filter,
      profile
    );
    expect(result).toBe(false);
    expect(evaluationPath).toEqual([
      "EQ('location.city', 'San Francisco') => false",
    ]);
  });
});

describe("operator evaluations", () => {
  it("should evaluate endsWith operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      email: "suhas@courier.com",
      country: "US",
    };
    const endsWithFilter: FilterConfig = {
      operator: "ENDS_WITH",
      path: "email",
      value: "courier.com",
    };

    const [result, evaluationPath] = evaluateAudienceMembership(
      endsWithFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "ENDS_WITH('email', 'courier.com') => true",
    ]);
  });
  it("should evaluate GreaterThan operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      taco_count: 1,
      email: "suhas@courier.com",
      country: "US",
    };
    const greaterThanFilter: FilterConfig = {
      operator: "GT",
      path: "taco_count",
      value: "0",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      greaterThanFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual(["GT('taco_count', '0') => true"]);
  });
  it("should evaluate includes operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      favorite_colors: ["blue", "green", "red"],
      email: "suhas@courier.com",
      country: "US",
    };
    const includesFilter: FilterConfig = {
      operator: "INCLUDES",
      path: "favorite_colors",
      value: "blue",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      includesFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "INCLUDES('favorite_colors', 'blue') => true",
    ]);
  });
  it("should evaluate IsAfter date operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      birthday: new Date(Date.parse("09/14/1987")).toISOString(),
      email: "suhas@courier.com",
      country: "US",
    };
    const isAfterFilter: FilterConfig = {
      operator: "IS_AFTER",
      path: "birthday",
      value: "1987-09-12T07:00:00.000Z",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      isAfterFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "IS_AFTER('birthday', '1987-09-12T07:00:00.000Z') => true",
    ]);
  });
  it("should evaluate LTE operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
        population: 100000,
      },
      email: "suhas@courier.com",
      country: "US",
    };
    const lteFilter: FilterConfig = {
      operator: "LTE",
      path: "location.population",
      value: "200000",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      lteFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "LTE('location.population', '200000') => true",
    ]);
  });
  it("should evaluate Not Equal to (NEQ) operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      email: "suhas@courier.com",
      country: "US",
    };
    const neqFilter: FilterConfig = {
      operator: "NEQ",
      path: "location.city",
      value: "Oakland",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      neqFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual(["NEQ('location.city', 'Oakland') => true"]);
  });
  it("should evaluate omit operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      email: "suhas@courier.com",
      country: "US",
    };
    const omitFilter: FilterConfig = {
      operator: "OMIT",
      path: "location.city",
      value: "San2",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      omitFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual(["OMIT('location.city', 'San2') => true"]);
  });

  it("should evaluate startsWith operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      email: "suhas@courier.com",
      country: "US",
    };
    const startsWithFilter: FilterConfig = {
      operator: "STARTS_WITH",
      path: "location.city",
      value: "San",
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      startsWithFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual([
      "STARTS_WITH('location.city', 'San') => true",
    ]);
  });

  it("should evaluate exists operator correctly", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      email: "suhas@courier.com",
      country: "US",
    };
    const existsWithFilter: FilterConfig = {
      operator: "EXISTS",
      path: "email",
      value: true,
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      existsWithFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual(["EXISTS('email', 'true') => true"]);
  });
  it("should evaluate exists operator correctly for falsy values", () => {
    const profile = {
      location: {
        city: "San Francisco",
      },
      country: "US",
    };
    const existsWithFilter: FilterConfig = {
      operator: "EXISTS",
      path: "email",
      value: false,
    };
    const [result, evaluationPath] = evaluateAudienceMembership(
      existsWithFilter,
      profile
    );
    expect(result).toBe(true);
    expect(evaluationPath).toEqual(["EXISTS('email', 'false') => true"]);
  });
});
