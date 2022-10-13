import { BadRequest } from "~/lib/http-errors";
import { buildAjvValidator, Validator } from "~/lib/build-ajv-validator";

describe("buildValidator", () => {
  const validator: Validator<any> = buildAjvValidator({
    $schema: "http://json-schema.org/draft-07/schema#",
    properties: {
      address: {
        properties: {
          city: {
            type: "string",
          },
          street: {
            type: "string",
          },
        },
        required: ["street"],
        type: "object",
      },
      age: {
        type: "number",
      },
      last_name: {
        type: "string",
      },
      name: {
        type: "string",
      },
      title: {
        enum: ["dr", "moo", "mr", "mrs", "ms", "prof", "supreme leader"],
        type: "string",
      },
    },
    required: ["address", "age", "name", "title"],
    type: "object",
  });

  it("should not throw given a valid payload", () => {
    expect(() =>
      validator({
        name: "Drew",
        age: 4,
        title: "supreme leader",
        address: {
          street: "blue st",
        },
      })
    ).not.toThrow();
  });

  it("should throw given an invalid payload", () => {
    expect(() =>
      validator({
        name: "Drew",
        age: 4,
        title: "supreme",
        address: {
          street: "blue st",
        },
      })
    ).toThrow(BadRequest);
  });
});
