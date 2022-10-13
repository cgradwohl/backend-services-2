import { clone } from "../clone";

describe("clone", () => {
  const world = "it's me";
  const base = {
    hello: { world },
  };

  it("clones an object", () => {
    const cloned = clone(base);
    expect(cloned).toMatchObject(base);
  });

  it("does not return any references to base object", () => {
    const next = clone(base);
    next.hello.world = "nose";
    expect(base.hello.world).toEqual(world);
  });
});
