import { complexSmsAndEmailTree } from "../../__mocks__/trees";
import { getAllRouteLeafs } from "../get-all-route-leafs";

describe("get all route leafs", () => {
  it("should return only live non-failover leafs", () => {
    expect(getAllRouteLeafs(complexSmsAndEmailTree)).toMatchSnapshot();
  });

  it("should return all live leafs including from failover branches", () => {
    expect(
      getAllRouteLeafs(complexSmsAndEmailTree, {
        includeFailoverBranches: true,
      })
    ).toMatchSnapshot();
  });

  it("should return all live and dead leafs", () => {
    expect(
      getAllRouteLeafs(complexSmsAndEmailTree, {
        includeDeadLeafs: true,
      })
    ).toMatchSnapshot();
  });
});
