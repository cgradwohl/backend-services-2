import createVariableHandler from "../../lib/variable-handler";

const aVariableHandler = {
  getContext: expect.any(Function),
  getParent: expect.any(Function),
  getRoot: expect.any(Function),
  getRootValue: expect.any(Function),
  getScoped: expect.any(Function),
  repeat: expect.any(Function),
  replace: expect.any(Function),
  resolve: expect.any(Function),
  resolveV2: expect.any(Function),
};

const foodItems = [
  { name: "burrito", customizations: [{ description: "no onions" }] },
  {
    customizations: [
      { description: "no meat" },
      { description: "add beans" },
      { description: "add sour cream", price: "$0.80" },
    ],
    name: "crunchwrap",
  },
  { name: "cinnamon twists" },
];

describe("createVariableHandler", () => {
  describe("constructor", () => {
    it("should be a function that takes a scoped context and returns handler functions", () => {
      expect(typeof createVariableHandler).toEqual("function");
      expect(createVariableHandler({ value: {} })).toEqual(aVariableHandler);
    });
  });

  describe("getParent", () => {
    it("should return a variable handler scoped to the current context's parent", () => {
      const variableHandler = createVariableHandler({
        value: {
          data: { deeper: { test: "found me" }, test: "still the wrong one" },
          test: "wrong one!",
        },
      });

      const deeperScopedVariableHandler = variableHandler
        .getScoped("data")
        .getScoped("deeper");
      const parentVariableHandler = deeperScopedVariableHandler.getParent();

      // sanity check
      expect(deeperScopedVariableHandler.resolve("@")).toEqual([
        { test: "found me" },
      ]);

      // should be scoped to $.data
      expect(parentVariableHandler.resolve("@")).toEqual(
        variableHandler.resolve("$.data")
      );
    });

    it("should return the current scope if at the root already", () => {
      const variableHandler = createVariableHandler({
        value: { data: 123 },
      });

      expect(variableHandler.getParent().resolve("@")).toEqual(
        variableHandler.resolve("@")
      );
    });
  });

  describe("getRoot", () => {
    it("should return a variable handler scoped to the current context's top most parent", () => {
      const variableHandler = createVariableHandler({
        value: {
          data: { deeper: { test: "wrong one" }, test: "still the wrong one" },
          test: "found me",
        },
      });

      const deeperScopedVariableHandler = variableHandler
        .getScoped("data")
        .getScoped("deeper");

      const rootVariableHandler = deeperScopedVariableHandler.getRoot();

      // should be scoped to $.data
      expect(rootVariableHandler.resolve("@")).toEqual(
        variableHandler.resolve("@")
      );
    });

    it("should return the current scope if at the root already", () => {
      const variableHandler = createVariableHandler({
        value: { data: 123 },
      });

      expect(variableHandler.getRoot().resolve("@")).toEqual(
        variableHandler.resolve("@")
      );
    });
  });

  describe("repeat", () => {
    it("should return an array of variable handlers scoped to json path values", () => {
      const { repeat } = createVariableHandler({
        value: { test: [{ name: "a" }, { name: "b" }, { name: "c" }] },
      });
      repeat("$.test").every(value => {
        expect(value).toEqual(aVariableHandler);
        return true;
      });
    });

    it("should work with an array of primatives", () => {
      const { repeat } = createVariableHandler({
        value: { test: ["a", "b", "c"] },
      });
      expect(repeat("$.test").map(({ replace }) => replace("{@}"))).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("should allow root json paths with an array of primatives", () => {
      const { repeat } = createVariableHandler({
        value: { working: "Oh yeah!", test: ["a", "b", "c"] },
      });
      expect(
        repeat("$.test").map(({ replace }) => replace("{$.working}"))
      ).toEqual(["Oh yeah!", "Oh yeah!", "Oh yeah!"]);
    });

    it("should gracefully handle no matching value", () => {
      const { repeat } = createVariableHandler({
        value: {},
      });
      expect(repeat("$.aKeyThatDoesNotExist")).toEqual([]);
    });

    it("should gracefully handle a bad json path", () => {
      const { repeat } = createVariableHandler({
        value: {},
      });
      expect(repeat("$.!($%&(*&$%(*&")).toEqual([]);
    });

    it("should work with an array of primatives", () => {
      const { repeat } = createVariableHandler({
        value: { test: [{ value: "a" }, { value: "b" }, { value: "c" }] },
      });
      expect(
        repeat("$.test.*").map(({ replace }) => replace("{@.value}"))
      ).toEqual(["a", "b", "c"]);
    });

    it("should handle pointing directly at an array the same as selecting each", () => {
      const { repeat } = createVariableHandler({
        value: { test: [{ value: "a" }, { value: "b" }, { value: "c" }] },
      });
      expect(
        repeat("$.test").map(({ replace }) => replace("{@.value}"))
      ).toEqual(["a", "b", "c"]);
    });

    it("should be able to do nested repeats", () => {
      const { repeat } = createVariableHandler({
        value: {
          items: foodItems,
        },
      });
      expect(
        repeat("$.items").map(({ repeat: childRepeat }) => {
          return childRepeat("@.customizations").map(({ replace }) => {
            return replace("{@.description}");
          });
        })
      ).toEqual([
        ["no onions"],
        ["no meat", "add beans", "add sour cream"],
        [],
      ]);
    });

    it("should properly detect when the user is selecting an array", () => {
      const myValue = [{ myValue: 1 }]; // one array value
      const { repeat } = createVariableHandler({
        value: {
          // including the one from myValue, we have three wrapped arrays. We
          // will target the middle one. It's important that each array only
          // has a single value making it unclear whether we should loop over
          // the result array or not
          test: [[myValue]],
        },
      });
      // before we begin, it's important to note that resolve() always returns
      // the value wrapped in an array. This is because JSONPath always returns
      // an array (ex: using "$.test" on { test: true } will give you "[true]")

      // we pointed directly to the array and want to iterate over it
      expect(repeat("$.test[0]")[0].resolve("@")).toEqual([myValue]);
      // script_expression
      expect(repeat("$.test[(@.length-1)]")[0].resolve("@")).toEqual([myValue]);

      // with these, we expect multiple results so, even if a single array was
      // returned we don't iterate over it

      // wildcard
      expect(repeat("$.test[0].*")[0].resolve("@")).toEqual([myValue]);
      // slice
      expect(repeat("$.test[-1:][0]")[0].resolve("@")).toEqual([myValue]);
      expect(repeat("$.test[:2][0]")[0].resolve("@")).toEqual([myValue]);
      // union
      expect(repeat("$.test[0,1][0]")[0].resolve("@")).toEqual([myValue]);
      // filter_expression
      expect(repeat("$.test[?(@.length > 0)][0]")[0].resolve("@")).toEqual([
        myValue,
      ]);
    });

    it("should work with scoped bracket notation", () => {
      const { repeat } = createVariableHandler({
        value: { test: [[{ found: true }]] },
      });
      // bracket notation is "@[0]"
      expect(repeat("$.test")[0].resolve("[0]")).toEqual([{ found: true }]);
      expect(repeat("$.test")[0].resolve("@[0]")).toEqual([{ found: true }]);
    });
  });

  describe("replace", () => {
    it("should loop through a string replacing variables with their resolved values", () => {
      const { replace } = createVariableHandler({ value: { name: "World" } });
      expect(replace("Hello {name}!")).toEqual("Hello World!");
    });

    it("should work with a variable by itself", () => {
      const { replace } = createVariableHandler({ value: { name: "World" } });
      expect(replace("{name}")).toEqual("World");
    });

    it("should work with a null string", () => {
      const { replace } = createVariableHandler({ value: { name: "World" } });
      expect(replace("")).toEqual("");
    });

    it("should work with no variables", () => {
      const { replace } = createVariableHandler({ value: { name: "World" } });
      expect(replace("This is a sentence.")).toEqual("This is a sentence.");
    });

    it("should work with multiple variables", () => {
      const { replace } = createVariableHandler({
        value: { greeting: "Hello", name: "World", punctuation: "!" },
      });
      expect(replace("{greeting} {name}{punctuation}")).toEqual("Hello World!");
    });

    it("should work with multiple lines", () => {
      const { replace } = createVariableHandler({
        value: { fromName: "Manager", toName: "Employee" },
      });
      expect(
        replace("Hello {toName},\n\nThis is a test message.\n\n - {fromName}")
      ).toEqual("Hello Employee,\n\nThis is a test message.\n\n - Manager");
    });

    it("should leave the text as-is if no matching variable was found", () => {
      const { replace } = createVariableHandler({ value: { name: "World" } });
      expect(replace("Hello {notFound}!")).toEqual("Hello {notFound}!");
    });

    it("should replace only the found variables and leave the unfound as-is", () => {
      const { replace } = createVariableHandler({
        value: { animal: "woodchuck" },
      });
      expect(
        replace(
          "If a {animal} could {verb} {noun}, how much {noun} could a {animal} {verb}?"
        )
      ).toEqual(
        "If a woodchuck could {verb} {noun}, how much {noun} could a woodchuck {verb}?"
      );
    });

    it("should just call toString() on array values", () => {
      const { replace } = createVariableHandler({
        value: { things: ["all", "the", "things"] },
      });
      expect(replace("Program {things}!")).toEqual("Program all, the, things!");
    });

    it("should expect call toString() on all JSONPath values returned", () => {
      const { replace } = createVariableHandler({
        value: { things: ["all", "the", "things"] },
      });
      expect(replace("Program {$.things.*}!")).toEqual(
        "Program all, the, things!"
      );
    });

    it("should gracefully handle a bad json path", () => {
      const { replace } = createVariableHandler({ value: {} });
      expect(replace("{$bad}")).toEqual("[Error]");
    });

    it("should gracefully handle an object", () => {
      const { replace } = createVariableHandler({
        value: { test: { imaobject: true } },
      });
      expect(replace("{$.test}")).toEqual("[object Object]");
    });

    it("should gracefully handle an array", () => {
      const { replace } = createVariableHandler({
        value: { test: ["a", "b", "c"] },
      });
      expect(replace("{$.test}")).toEqual("a, b, c");
    });

    it("should gracefully handle an array of objects", () => {
      const { replace } = createVariableHandler({
        value: { test: [{}, {}, {}] },
      });
      expect(replace("{$.test}")).toEqual(
        "[object Object], [object Object], [object Object]"
      );
    });
  });

  describe("resolve", () => {
    it("should resolve a value given a json path", () => {
      const { resolve } = createVariableHandler({ value: { test: "worked" } });
      expect(resolve("$.test")).toEqual(["worked"]);
    });

    it("should use the default value if JSONPath could not find anything", () => {
      const { resolve } = createVariableHandler({ value: { test: "worked" } });
      expect(resolve("$.na", "my default value")).toEqual("my default value");
    });

    it("should work with deeply nested values", () => {
      const { resolve } = createVariableHandler({
        value: { a: { b: { c: { d: "you found me" } } } },
      });
      expect(resolve("$..d")).toEqual(["you found me"]);
    });

    it("should work with scoped value even without a repeat", () => {
      const { resolve } = createVariableHandler({ value: { test: "worked" } });
      expect(resolve("@.test")).toEqual(["worked"]);
    });

    it('should work with lazy mode (no "$." or "@." prefix)', () => {
      const { resolve } = createVariableHandler({ value: { test: "worked" } });
      expect(resolve("test")).toEqual(["worked"]);
    });

    it('should use default with lazy mode (no "$." or "@." prefix)', () => {
      const { resolve } = createVariableHandler({ value: { test: "worked" } });
      expect(resolve("na", "my default value")).toEqual("my default value");
    });

    it("should gracefully handle primative value", () => {
      const { resolve } = createVariableHandler({ value: "just a string" });

      // will happen if you repeat over an array of primatives
      expect(resolve("@")).toEqual(["just a string"]);
      expect(resolve("@.value")).toEqual(undefined);
      expect(resolve("@.value", "default value")).toEqual("default value");

      // not likely to happen
      expect(resolve("$")).toEqual(["just a string"]);
      expect(resolve("$.value")).toEqual(undefined);
      expect(resolve("$.value", "default value")).toEqual("default value");
    });

    it("should gracefully handle a null string", () => {
      const { resolve } = createVariableHandler({ value: { test: true } });
      expect(resolve("")).toEqual(undefined);
      expect(resolve("", "default value")).toEqual("default value");
    });

    it("should return an array value", () => {
      const { resolve } = createVariableHandler({
        value: { items: ["a", "b", "c"] },
      });
      expect(resolve("$.items")).toEqual([["a", "b", "c"]]);
    });

    it("should all values of a json path", () => {
      const { resolve } = createVariableHandler({
        value: { items: ["a", "b", "c"] },
      });
      expect(resolve("$.items.*")).toEqual(["a", "b", "c"]);
    });

    it("should work with arrays and bracket notation", () => {
      const { resolve } = createVariableHandler({ value: ["a", "b", "c"] });
      expect(resolve("$[0]")).toEqual(["a"]);
      expect(resolve("[0]")).toEqual(["a"]);
    });

    it("should work with string bracket notation", () => {
      const { resolve } = createVariableHandler({ value: { test: "worked!" } });
      expect(resolve('$["test"]')).toEqual(["worked!"]);
      expect(resolve('["test"]')).toEqual(["worked!"]);
    });

    it("should gracefully handle a bad json path", () => {
      const { resolve } = createVariableHandler({ value: { test: "worked!" } });
      expect(resolve("$bad")).toEqual(undefined);
      expect(resolve("$bad", "my default value")).toEqual("my default value");
    });

    it("should allow lazy select with a dot in front", () => {
      const { resolve } = createVariableHandler({
        value: { test: "worked!", test2: [{ value: 1 }] },
      });
      expect(resolve(".test")).toEqual(["worked!"]);
      expect(resolve("..value")).toEqual([1]);
    });
  });
});
